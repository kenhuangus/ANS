import { NextResponse, type NextRequest } from 'next/server';
import { AgentCapabilityRequestSchema } from '@/lib/schemas';
import { findAgentByAnsName, findAgents } from '@/lib/db';
import { parseANSName, versionNegotiation } from '@/lib/ans';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData, verifyCertificateChain, checkCertificateRevocation } from '@/lib/pki';
import type { AgentRecord, Protocol } from '@/types';
import type { AgentCapabilityRequestPayload } from '@/lib/schemas';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData: Partial<AgentCapabilityRequestPayload> = {
      requestType: "resolve", // default or from query
    };
    
    if (searchParams.has('ansName')) queryData.ansName = searchParams.get('ansName')!;
    if (searchParams.has('protocol')) queryData.protocol = searchParams.get('protocol') as Protocol;
    if (searchParams.has('agentID')) queryData.agentID = searchParams.get('agentID')!;
    if (searchParams.has('agentCapability')) queryData.agentCapability = searchParams.get('agentCapability')!;
    if (searchParams.has('provider')) queryData.provider = searchParams.get('provider')!;
    if (searchParams.has('version')) queryData.version = searchParams.get('version')!;
    if (searchParams.has('extension')) queryData.extension = searchParams.get('extension')!;


    const validation = AgentCapabilityRequestSchema.safeParse(queryData);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request query", details: validation.error.format() }, { status: 400 });
    }
    const data = validation.data;

    let resolvedAgents: AgentRecord[] = [];

    if (data.ansName) {
      // Direct lookup by full ANSName
      // For version negotiation with full ANSName, the version in ANSName is the target
      const parsed = parseANSName(data.ansName);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid ANSName format" }, { status: 400 });
      }
      const agentsWithSameBase = await findAgents(
        parsed.protocol,
        parsed.agentId,
        parsed.capability,
        parsed.provider,
        undefined, // fetch all versions first
        parsed.extension || undefined
      );
      const agent = versionNegotiation(agentsWithSameBase, parsed.version);
      if (agent) resolvedAgents.push(agent);

    } else {
      // Capability-based lookup
      const matchedAgents = await findAgents(
        data.protocol,
        data.agentID,
        data.agentCapability,
        data.provider,
        undefined, // fetch all versions for this base
        data.extension
      );
      
      // Perform version negotiation if a specific version range was requested
      if (data.version && data.version !== "*") {
        const agent = versionNegotiation(matchedAgents, data.version);
        if (agent) resolvedAgents.push(agent);
      } else { // If version is "*" or not specified, return all matched (or highest if that's the policy)
        // For simplicity, returning all compatible. Paper implies returning one negotiated match.
        // If only one match is expected, use:
        // const agent = versionNegotiation(matchedAgents, data.version || "*");
        // if (agent) resolvedAgents.push(agent);
        resolvedAgents = matchedAgents; // returning all matching base agents if version is wildcard
      }
    }

    if (resolvedAgents.length === 0) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no agent found, not 404
    }

    // Formal Resolution Algorithm Step 5-8 (VerifyAgentEndpointRecord)
    const verifiedResponses = [];
    for (const agent of resolvedAgents) {
      // 1. Verify agent's certificate (ensure it's valid and not revoked - mocked)
      const isAgentCertValid = await verifyCertificateChain(agent.certificatePem, LOCAL_CA_CERTIFICATE_PEM /* Assuming local CA is trusted root for agent certs */);
      const isAgentCertRevoked = await checkCertificateRevocation(agent.certificatePem);

      if (!isAgentCertValid || isAgentCertRevoked) {
        console.warn(`Agent ${agent.ansName} certificate is invalid or revoked. Skipping.`);
        continue; 
      }

      // Construct data to be signed by Agent Registry
      const dataToSign = JSON.stringify({
        Endpoint: agent.ansName,
        actualEndpoint: agent.actualEndpoint,
        agentCertificatePem: agent.certificatePem,
        ttl: agent.ttl,
      });

      // Sign with Agent Registry's private key
      const registrySignature = await signData(dataToSign, AGENT_REGISTRY_PRIVATE_KEY_PEM);
      
      verifiedResponses.push({
        Endpoint: agent.ansName, // This is the Agent's ANSName
        actualEndpoint: agent.actualEndpoint,
        agentCertificatePem: agent.certificatePem, // The resolved agent's certificate
        registrySignature: registrySignature,
        registryCertificatePem: AGENT_REGISTRY_CERTIFICATE_PEM, // The Agent Registry's certificate
        ttl: agent.ttl,
      });
    }
    
    if (verifiedResponses.length === 0) {
         return NextResponse.json([], { status: 200 });
    }

    // If the original request implies a single agent (e.g. by full ANSName), return the single verified response.
    // Otherwise, return an array. For simplicity here, always returning array.
    return NextResponse.json(verifiedResponses, { status: 200 });

  } catch (error) {
    console.error("Lookup Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during lookup.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
