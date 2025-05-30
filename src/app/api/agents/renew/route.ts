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
      data.actualEndpoint
    );

    if (!renewedAgent) {
      // Should not happen if findAgentByAnsName succeeded, but as a safeguard
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
