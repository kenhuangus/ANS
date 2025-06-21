
import { NextResponse, type NextRequest } from 'next/server';
import { findAgents } from '@/lib/db';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData, verifyCertificateChain, checkCertificateRevocation, LOCAL_CA_CERTIFICATE_PEM } from '@/lib/pki';
import type { AgentRecord } from '@/types';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || undefined; 
    
    let resolvedAgents: AgentRecord[] = await findAgents(searchQuery);

    if (resolvedAgents.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }

    const verifiedResponses = [];
    for (const agent of resolvedAgents) {
      // findAgents already filters for !isRevoked. If this changes, this check is important.
      // if (agent.isRevoked) {
      //   continue;
      // }

      const isAgentCertValid = await verifyCertificateChain(agent.certificatePem, LOCAL_CA_CERTIFICATE_PEM);
      const isAgentCertRevokedByPki = await checkCertificateRevocation(agent.certificatePem);

      if (!isAgentCertValid || isAgentCertRevokedByPki) {
        console.warn(`Agent ${agent.ansName} certificate is invalid or PKI revoked. Skipping.`);
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
    
    if (verifiedResponses.length === 0 && resolvedAgents.some(a => !a.isRevoked)) {
        return NextResponse.json({ error: "Agents found but failed PKI verification (certificate invalid/revoked)." }, { status: 404 });
    }
     if (verifiedResponses.length === 0) { 
         return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(verifiedResponses, { status: 200 });

  } catch (error) {
    console.error("Lookup API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during lookup.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST

export async function POST(request: NextRequest) {
  try {
    // JSON-Body parsen
    const { query } = await request.json() as { query?: string };

    let resolvedAgents: AgentRecord[] = await findAgents(query);

    if (resolvedAgents.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }

    const verifiedResponses = [];
    for (const agent of resolvedAgents) {
      const isAgentCertValid = await verifyCertificateChain(agent.certificatePem, LOCAL_CA_CERTIFICATE_PEM);
      const isAgentCertRevokedByPki = await checkCertificateRevocation(agent.certificatePem);

      if (!isAgentCertValid || isAgentCertRevokedByPki) {
        console.warn(`Agent ${agent.ansName} certificate is invalid or PKI revoked. Skipping.`);
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
        protocolExtensionsJson: agent.protocolExtensionsJson
      });
    }

    if (verifiedResponses.length === 0 && resolvedAgents.some(a => !a.isRevoked)) {
      return NextResponse.json({ error: "Agents found but failed PKI verification (certificate invalid/revoked)." }, { status: 404 });
    }
    if (verifiedResponses.length === 0) { 
      return NextResponse.json([], { status: 200 });
    }

    // Für POST: explizit als Daten-API antworten
    return NextResponse.json(verifiedResponses, { status: 200 });

  } catch (error) {
    console.error("Lookup API POST Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during lookup.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}



