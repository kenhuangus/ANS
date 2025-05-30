import { NextResponse, type NextRequest } from 'next/server';
import { AgentRegistrationRequestSchema } from '@/lib/schemas';
import { addAgent, findAgentByAnsName } from '@/lib/db'; 
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

    // Even though fields are optional in schema for AI-fill later,
    // for actual registration, core components are needed.
    // AI would ideally fill these if missing from user input.
    if (!data.protocol || !data.agentID || !data.agentCapability || !data.provider || !data.version || !data.actualEndpoint || !data.certificate?.pem || !data.certificate?.subject) {
      return NextResponse.json({ 
        error: "Missing essential agent information for registration. Required: protocol, agentID, agentCapability, provider, version, actualEndpoint, certificate PEM and subject." 
      }, { status: 400 });
    }
    
    // Construct ANSName based on provided (or AI-filled) data
    const ansName = constructANSName({
      protocol: data.protocol,
      agentID: data.agentID,
      agentCapability: data.agentCapability,
      provider: data.provider,
      version: data.version,
      extension: data.extension || undefined, // Pass undefined if null or empty
    });
    
    const existingAgent = await findAgentByAnsName(ansName);
    if (existingAgent) {
      return NextResponse.json({ error: `Agent with ANSName "${ansName}" already actively registered.` }, { status: 409 });
    }

    // Mock CA signing the CSR
    // data.certificate.pem should be a CSR. If AI generates this, it needs to be a valid CSR string.
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
      agentCertificatePem, 
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
    if (error instanceof Error && error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 }); 
    }
    console.error("Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}