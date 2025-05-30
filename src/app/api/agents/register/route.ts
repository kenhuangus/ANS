import { NextResponse, type NextRequest } from 'next/server';
import { AgentRegistrationRequestSchema } from '@/lib/schemas';
import { addAgent, findAgentByAnsName } from '@/lib/db'; // Added findAgentByAnsName
import { generateCertificate, LOCAL_CA_CERTIFICATE_PEM, LOCAL_CA_PRIVATE_KEY_PEM } from '@/lib/pki';
import { constructANSName } from '@/lib/ans';
import type { AgentRegistrationRequestPayload } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AgentRegistrationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request payload", details: validation.error.format() }, { status: 400 });
    }

    const data: AgentRegistrationRequestPayload = validation.data;

    const ansName = constructANSName({
      protocol: data.protocol,
      agentID: data.agentID,
      agentCapability: data.agentCapability,
      provider: data.provider,
      version: data.version,
      extension: data.extension,
    });
    
    // Check if an active agent with this ANSName already exists.
    // The addAgent function in db.ts will also perform a check, but this provides a cleaner 409 response.
    const existingAgent = await findAgentByAnsName(ansName);
    if (existingAgent) {
      return NextResponse.json({ error: `Agent with ANSName "${ansName}" already actively registered.` }, { status: 409 });
    }

    // Mock CA signing the CSR
    const agentCertificatePem = await generateCertificate(
      data.certificate.pem, 
      LOCAL_CA_CERTIFICATE_PEM, 
      LOCAL_CA_PRIVATE_KEY_PEM
    );

    const registeredAgent = await addAgent(
      ansName,
      data.protocol,
      data.agentID,
      data.agentCapability,
      data.provider,
      data.version,
      data.extension || null,
      agentCertificatePem, // Store the signed certificate
      data.protocolExtensions ? JSON.stringify(data.protocolExtensions) : null,
      data.actualEndpoint
    );

    return NextResponse.json({
      ansName: registeredAgent.ansName,
      agentCertificatePem: registeredAgent.certificatePem,
      message: "Agent registered successfully.",
      registrationTimestamp: registeredAgent.registrationTimestamp,
    }, { status: 201 });

  } catch (error) {
    // Catch specific error from addAgent if it's about duplication
    if (error instanceof Error && error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    console.error("Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
