
import { NextResponse, type NextRequest } from 'next/server';
import { AgentCapabilityRequestSchema } from '@/lib/schemas';
import { findAgentByAnsName, findAgents } from '@/lib/db';
import { parseANSName, versionNegotiation } from '@/lib/ans';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData, verifyCertificateChain, checkCertificateRevocation, LOCAL_CA_CERTIFICATE_PEM } from '@/lib/pki';
import type { AgentRecord, Protocol } from '@/types';
import type { AgentCapabilityRequestPayload } from '@/lib/schemas';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData: Partial<AgentCapabilityRequestPayload> = {
      // requestType will default to 'resolve' if not in query due to schema optionality
    };
    
    // Populate queryData from searchParams
    if (searchParams.has('requestType')) queryData.requestType = "resolve"; // only "resolve" is supported
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

    const hasAnsName = data.ansName && data.ansName.trim() !== "";
    const hasAnyAttribute = data.protocol || data.agentID || data.agentCapability || data.provider || data.version || data.extension;

    // If no specific lookup parameters are provided (other than requestType), list all agents.
    // Otherwise, proceed with specific lookup.

    let resolvedAgents: AgentRecord[] = [];

    if (data.ansName) {
      const parsed = parseANSName(data.ansName);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid ANSName format" }, { status: 400 });
      }
      // For version negotiation with full ANSName, the version in ANSName is the target
      const agentsWithSameBase = await findAgents(
        parsed.protocol,
        parsed.agentId,
        parsed.capability,
        parsed.provider,
        undefined, // fetch all versions first for this base
        parsed.extension || undefined
      );
      const agent = versionNegotiation(agentsWithSameBase, parsed.version);
      if (agent) resolvedAgents.push(agent);

    } else { // This includes the case where only requestType is present, or other attributes.
      const matchedAgents = await findAgents(
        data.protocol,
        data.agentID,
        data.agentCapability,
        data.provider,
        undefined, 
        data.extension || undefined
      );
      
      if (data.version && data.version !== "*") {
        const suitableAgentsForVersion = [];
        for (const potentialAgent of matchedAgents) {
            // versionNegotiation expects an array, so wrap each agent
            const agent = versionNegotiation([potentialAgent], data.version);
            if (agent) suitableAgentsForVersion.push(agent);
        }
        resolvedAgents = suitableAgentsForVersion;
      } else { 
        resolvedAgents = matchedAgents; 
      }
    }

    if (resolvedAgents.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }

    const verifiedResponses = [];
    for (const agent of resolvedAgents) {
      const isAgentCertValid = await verifyCertificateChain(agent.certificatePem, LOCAL_CA_CERTIFICATE_PEM);
      const isAgentCertRevoked = await checkCertificateRevocation(agent.certificatePem);

      if (!isAgentCertValid || isAgentCertRevoked) {
        console.warn(`Agent ${agent.ansName} certificate is invalid or revoked. Skipping.`);
        continue; 
      }

      const dataToSign = JSON.stringify({
        Endpoint: agent.ansName,
        actualEndpoint: agent.actualEndpoint,
        agentCertificatePem: agent.certificatePem,
        ttl: agent.ttl,
      });

      const registrySignature = await signData(dataToSign, AGENT_REGISTRY_PRIVATE_KEY_PEM);
      
      verifiedResponses.push({
        Endpoint: agent.ansName,
        actualEndpoint: agent.actualEndpoint,
        agentCertificatePem: agent.certificatePem,
        registrySignature: registrySignature,
        registryCertificatePem: AGENT_REGISTRY_CERTIFICATE_PEM,
        ttl: agent.ttl,
      });
    }
    
    if (verifiedResponses.length === 0 && resolvedAgents.length > 0) {
        return NextResponse.json({ error: "Agents found but failed verification (certificate invalid/revoked)." }, { status: 404 });
    }
     if (verifiedResponses.length === 0) { 
         return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(verifiedResponses, { status: 200 });

  } catch (error) {
    console.error("Lookup Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during lookup.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
