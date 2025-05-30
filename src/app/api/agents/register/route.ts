import { NextResponse, type NextRequest } from 'next/server';
import { AgentRegistrationRequestSchema } from '@/lib/schemas';
import { addAgent } from '@/lib/db';
import { generateCertificate, LOCAL_CA_CERTIFICATE_PEM, LOCAL_CA_PRIVATE_KEY_PEM } from '@/lib/pki';
import { constructANSName, parseANSName } from '@/lib/ans';
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
      version: data.version, // This should be the base version string like "1.0.0"
      extension: data.extension,
    });
    
    // Check if agent already exists (using the constructed ANSName)
    // const existingAgent = await findAgentByAnsName(ansName); // findAgentByAnsName is not exported from db.ts in this simple mock
    // if (existingAgent) {
    //   return NextResponse.json({ error: `Agent with ANSName "${ansName}" already exists.` }, { status: 409 });
    // }


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
    console.error("Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during registration.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
