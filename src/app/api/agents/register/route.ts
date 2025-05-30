
import { NextResponse, type NextRequest } from 'next/server';
import { AgentRegistrationRequestBaseSchema, type AgentRegistrationRequestPayload, semanticVersionPattern } from '@/lib/schemas';
import { addAgent, findAgentByAnsName } from '@/lib/db';
import { generateCertificate, LOCAL_CA_CERTIFICATE_PEM, LOCAL_CA_PRIVATE_KEY_PEM } from '@/lib/pki';
import { constructANSName } from '@/lib/ans';
// AgentRegistrationRequestPayload type is already imported from schemas

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AgentRegistrationRequestBaseSchema.safeParse(body); // Use the correct schema

    if (!validation.success) {
      console.error("API Validation Error:", validation.error.format());
      return NextResponse.json({ error: "Invalid request payload", details: validation.error.format() }, { status: 400 });
    }

    const data: AgentRegistrationRequestPayload = validation.data;

    // Essential data checks, even if schema allows optional for AI fill.
    // Client-side completeSampleValues should ensure these are populated.
    if (!data.protocol || !data.agentID || !data.agentCapability || !data.provider || !data.version || !data.actualEndpoint || !data.certificate?.pem || !data.certificate?.subject) {
      console.error("API Error: Missing essential agent information post-validation. Payload:", data);
      return NextResponse.json({
        error: "API Error: Missing essential agent information for registration. Ensure all fields like protocol, agentID, capability, provider, version, actualEndpoint, certificate PEM and subject are provided."
      }, { status: 400 });
    }
    // Additional specific checks
     if (typeof data.certificate.pem !== 'string' || data.certificate.pem.trim() === '') {
        console.error("API Error: Certificate PEM is missing or not a string in validated data.", data.certificate);
        return NextResponse.json({ error: "API Error: Invalid certificate PEM data after validation." }, { status: 400 });
    }
    // Ensure version is string and matches pattern if it's not optional in constructANSName or addAgent
    if (typeof data.version !== 'string' || !semanticVersionPattern.test(data.version)) {
        console.error("API Error: Version is missing, not a string, or invalid in validated data.", data.version);
        return NextResponse.json({ error: "API Error: Invalid version data after validation." }, { status: 400 });
    }


    const ansName = constructANSName({
      protocol: data.protocol,
      agentID: data.agentID,
      agentCapability: data.agentCapability,
      provider: data.provider,
      version: data.version,
      extension: data.extension || undefined,
    });

    const existingAgent = await findAgentByAnsName(ansName);
    if (existingAgent) {
      return NextResponse.json({ error: `Agent with ANSName "${ansName}" already actively registered.` }, { status: 409 });
    }

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
    // Log the full error object, including stack if available
    // Using Object.getOwnPropertyNames to get non-enumerable properties like 'message' and 'stack'
    console.error("Detailed Registration API Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    let errorMessage = "An unknown error occurred during registration.";
    let statusCode = 500;

    if (error instanceof SyntaxError && error.message.toLowerCase().includes("json")) {
        // This can happen if request.json() fails
        errorMessage = `Invalid JSON in request body: ${error.message}`;
        statusCode = 400;
    } else if (error instanceof Error) {
        errorMessage = error.message;
        // Check specifically for the error thrown by addAgent or similar
        if (error.message.includes("already actively registered") || error.message.includes("already exists")) {
            statusCode = 409;
        }
    }
    // Ensure the message passed to the client is somewhat generic for unknown errors
    // but specific for known ones, prefixed to indicate API origin.
    return NextResponse.json({ error: `API Registration Error: ${errorMessage}` }, { status: statusCode });
  }
}
