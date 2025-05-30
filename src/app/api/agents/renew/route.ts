import { NextResponse, type NextRequest } from 'next/server';
import { AgentRenewalRequestSchema } from '@/lib/schemas';
import { findAgentByAnsName, renewAgent } from '@/lib/db';
import { generateCertificate, LOCAL_CA_CERTIFICATE_PEM, LOCAL_CA_PRIVATE_KEY_PEM } from '@/lib/pki';
import type { AgentRenewalRequestPayload } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AgentRenewalRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request payload", details: validation.error.format() }, { status: 400 });
    }

    const data: AgentRenewalRequestPayload = validation.data;

    // Essential data for renewal, even if schema is all optional for AI-fill
    if (!data.ansName || !data.certificate?.pem || !data.certificate?.subject) {
      return NextResponse.json({ 
        error: "Missing essential agent information for renewal. Required: ansName, certificate PEM and subject." 
      }, { status: 400 });
    }

    const existingAgent = await findAgentByAnsName(data.ansName);
    if (!existingAgent || existingAgent.isRevoked) {
      return NextResponse.json({ error: `Agent with ANSName "${data.ansName}" not found or is revoked.` }, { status: 404 });
    }

    // Mock CA signing the new CSR for renewal
    const newAgentCertificatePem = await generateCertificate(
      data.certificate.pem,
      LOCAL_CA_CERTIFICATE_PEM,
      LOCAL_CA_PRIVATE_KEY_PEM
    );

    const renewedAgent = await renewAgent(
      data.ansName,
      newAgentCertificatePem,
      data.protocolExtensions ? JSON.stringify(data.protocolExtensions) : undefined,
      data.actualEndpoint // Pass through the optional actualEndpoint
    );

    if (!renewedAgent) {
      return NextResponse.json({ error: `Failed to renew agent "${data.ansName}".` }, { status: 500 });
    }

    return NextResponse.json({
      ansName: renewedAgent.ansName,
      agentCertificatePem: renewedAgent.certificatePem,
      message: "Agent renewed successfully.",
      renewalTimestamp: renewedAgent.renewalTimestamp,
    }, { status: 200 });

  } catch (error) {
    console.error("Renewal Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during renewal.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}