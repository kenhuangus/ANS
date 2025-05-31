
import type { AgentRecord, Protocol } from '@/types';
import { parseANSName, constructANSName, versionNegotiation } from '@/lib/ans';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData } from '@/lib/pki';

// Mock in-memory database
let agentsDB: AgentRecord[] = [];
let nextId = 1;

export async function initializeDb() {
  // No-op for in-memory, but could load initial data if needed
  console.log("Mock DB initializing with sample data...");
  
  if (agentsDB.length === 0) {
    const sampleAgentA2A: Omit<AgentRecord, 'id' | 'registrationTimestamp'> = {
      ansName: "a2a://translator.text.ExampleOrg.v1.0.0.general",
      protocol: "a2a",
      agentIdPart: "translator",
      capability: "text",
      provider: "ExampleOrg",
      version: "1.0.0",
      extensionPart: "general",
      certificatePem: "-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIJAJ5dM2VqD3wXMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV\nBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNV\nBAoMC0V4YW1wbGVPcmcxEjAQBgNVBAMMCWExYS5sb2NhbDAeFw0yNDA1MzAxMjAx\nMTZaFw0yNTA1MzAxMjAxMTZaMFgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEU\nMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNVBAoMC0V4YW1wbGVPcmcxEjAQBgNV\nBAMMCWExYS5sb2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALM5\nN7j6qN7T/yP4l9KqY8u4i7P8n6e3V2v7X8r/t9Y8P/w4U3K9N/o7R2m+E9v9Q7x\n+F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB0GA1UdDgQWBBQpY5kO7z4W\ncX8qG3wXk9V7T/yP4jAfBgNVHSMEGDAWgBQpY5kO7z4WcX8qG3wXk9V7T/yP4jAM\nBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBlW4F8QY9g8o8p6D/m8N\n/R9qAgMBAAE=\n-----END CERTIFICATE-----",
      protocolExtensionsJson: JSON.stringify({ 
        description: "A2A agent that translates text between languages using ExampleOrg's proprietary API.",
        supportedLanguages: ["en", "es", "fr", "de", "ja"],
        a2aVersion: "1.1",
        rateLimit: "100 requests/minute"
      }),
      actualEndpoint: "https://api.example.org/a2a/translator/v1",
      renewalTimestamp: null,
      isRevoked: false,
      ttl: 3600,
    };
    await addAgent(sampleAgentA2A.ansName, sampleAgentA2A.protocol, sampleAgentA2A.agentIdPart, sampleAgentA2A.capability, sampleAgentA2A.provider, sampleAgentA2A.version, sampleAgentA2A.extensionPart, sampleAgentA2A.certificatePem, sampleAgentA2A.protocolExtensionsJson, sampleAgentA2A.actualEndpoint, sampleAgentA2A.ttl);

    const sampleAgentMCP: Omit<AgentRecord, 'id' | 'registrationTimestamp'> = {
      ansName: "mcp://sentimentAnalyzer.text.ExampleCorp.v1.2.0",
      protocol: "mcp",
      agentIdPart: "sentimentAnalyzer",
      capability: "text",
      provider: "ExampleCorp",
      version: "1.2.0",
      extensionPart: null,
      certificatePem: "-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIJALgY9g8o8p6DMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV\nBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLU2FuIEZyYW5jaXNjbzEUMBIG\nA1UECgwLRXhhbXBsZUNvcnAxEjAQBgNVBAMMCW1jcC5sb2NhbDAeFw0yNDA1MzAx\nMjAyMjJaFw0yNTA1MzAxMjAyMjJaMFgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJD\nQTEUMBIGA1UEBwwLU2FuIEZyYW5jaXNjbzEUMBIGA1UECgwLRXhhbXBsZUNvcnAx\nEjAQBgNVBAMMCW1jcC5sb2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\nggEBAOn/gB5sP/G3z8K5vP4g7j8N4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y\n6q/C4n2k7U5e8V2A3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o\n7R2m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB0GA1UdDgQW\nBBQ7e8V2A3w9mB6y9r/J5kP/t3n5GjAfBgNVHSMEGDAWgBQ7e8V2A3w9mB6y9r/J\n5kP/t3n5GjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBvP4g7j8N\n4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r/J\n5kP/t3n5Gq7z8V6l8r=\n-----END CERTIFICATE-----",
      protocolExtensionsJson: JSON.stringify({
        "description": "MCP agent that analyzes sentiment of provided text (positive, negative, neutral) and returns a score.",
        "input_schema": { "type": "object", "properties": {"text_input": { "type": "string", "description": "UTF-8 encoded text to analyze." }}},
        "output_schema": { "type": "object", "properties": { "sentiment": { "type": "string", "enum": ["positive", "negative", "neutral"] }, "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 } } },
        "mcpToolId": "sentiment-analyzer-v1",
        "mcpEndpoint": "https://api.example.corp/mcp/sentiment"
      }),
      actualEndpoint: "https://api.example.corp/mcp/sentiment",
      renewalTimestamp: null,
      isRevoked: false,
      ttl: 7200,
    };
    await addAgent(sampleAgentMCP.ansName, sampleAgentMCP.protocol, sampleAgentMCP.agentIdPart, sampleAgentMCP.capability, sampleAgentMCP.provider, sampleAgentMCP.version, sampleAgentMCP.extensionPart, sampleAgentMCP.certificatePem, sampleAgentMCP.protocolExtensionsJson, sampleAgentMCP.actualEndpoint, sampleAgentMCP.ttl);

    const sampleAgentACP: Omit<AgentRecord, 'id' | 'registrationTimestamp'> = {
      ansName: "acp://conciergeBot.interactive.AISolutionsLLC.v0.9.5-beta.hospitality",
      protocol: "acp",
      agentIdPart: "conciergeBot",
      capability: "interactive",
      provider: "AISolutionsLLC",
      version: "0.9.5-beta",
      extensionPart: "hospitality",
      certificatePem: "-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIJAK/O9X7s8P/wMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV\nBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwNU2FudGEgQ2xhcmExFzAVBgNV\nBAoMDkFJU29sdXRpb25zTExDMRMwEQYDVQQDDAphY3AubG9jYWwwHhcNMjQwNTMw\nMTIwMzMwWhcNMjUwNTMwMTIwMzMwWjBYMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwN\nU2FudGEgQ2xhcmExFzAVBgNVBAoMDkFJU29sdXRpb25zTExDMRMwEQYDVQQDDAph\nY3AubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC/O9X7s8P\n/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB\n0GA1UdDgQWBBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAfBgNVHSMEGDAWgBQG7sR4\nl8K7P8vF9G3sK8vK8vL8HTAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IB\nAQBiY9vC8p7K/P7j6D+M8N/R9qAgMBAAE=\n-----END CERTIFICATE-----",
      protocolExtensionsJson: JSON.stringify({
        description: "ACP agent providing interactive concierge services for the hospitality sector. Currently in beta.",
        acpVersion: "1.3",
        supportedChannels: ["websocket", "grpc"],
        stateManagement: "session-based",
        supportedIntents: ["room_booking", "restaurant_reservation", "local_attractions", "service_request"],
        defaultLanguage: "en-US",
        availableLanguages: ["en-US", "es-MX", "fr-CA"]
      }),
      actualEndpoint: "wss://concierge.aisolutions.llc/acp/v1/hospitality", // ACP might use WebSockets or gRPC
      renewalTimestamp: null,
      isRevoked: false,
      ttl: 1800,
    };
    await addAgent(sampleAgentACP.ansName, sampleAgentACP.protocol, sampleAgentACP.agentIdPart, sampleAgentACP.capability, sampleAgentACP.provider, sampleAgentACP.version, sampleAgentACP.extensionPart, sampleAgentACP.certificatePem, sampleAgentACP.protocolExtensionsJson, sampleAgentACP.actualEndpoint, sampleAgentACP.ttl);
    console.log(`Mock DB populated with ${agentsDB.length} sample agents.`);
  }
}

export async function addAgent(
  ansName: string,
  protocol: Protocol,
  agentIdPart: string,
  capability: string,
  provider: string,
  version: string, // e.g. "1.0.0" or "1.0.0-beta"
  extensionPart: string | null,
  certificatePem: string,
  protocolExtensionsJson: string | null,
  actualEndpoint: string,
  ttl: number = 300 // Default TTL if not provided
): Promise<AgentRecord> {
  // Find if an agent with the exact same ANSName already exists and is not revoked.
  const existingActiveAgent = agentsDB.find(agent => agent.ansName === ansName && !agent.isRevoked);
  if (existingActiveAgent) {
    throw new Error(`Agent with ANSName "${ansName}" already actively registered.`);
  }
  // If an agent with the same ANSName exists but is revoked, it's okay to "re-register" (effectively creating a new record).
  // Or, one might choose to update the revoked record, but for simplicity, we add a new one.

  const newAgent: AgentRecord = {
    id: nextId++,
    ansName,
    protocol,
    agentIdPart,
    capability,
    provider,
    version,
    extensionPart,
    certificatePem,
    protocolExtensionsJson,
    actualEndpoint,
    registrationTimestamp: new Date().toISOString(),
    renewalTimestamp: null,
    isRevoked: false,
    ttl,
  };
  agentsDB.push(newAgent);
  console.log(`Added agent: ${ansName}`);
  return newAgent;
}

export async function findAgentByAnsName(ansName: string): Promise<AgentRecord | null> {
  return agentsDB.find(agent => agent.ansName === ansName && !agent.isRevoked) || null;
}

export async function findAgents(
  protocol?: Protocol,
  agentIdPart?: string,
  capability?: string,
  provider?: string,
  requestedVersion?: string, // Can be a specific version or a range like "1.0.x" or "*"
  extensionPart?: string
): Promise<AgentRecord[]> {
  let results = agentsDB.filter(agent => !agent.isRevoked);

  if (protocol) results = results.filter(agent => agent.protocol === protocol);
  if (agentIdPart) results = results.filter(agent => agent.agentIdPart === agentIdPart);
  if (capability) results = results.filter(agent => agent.capability === capability);
  if (provider) results = results.filter(agent => agent.provider === provider);
  
  // Handle extensionPart: if undefined, match any; if null, match only null; if string, match string.
  if (extensionPart === null) {
    results = results.filter(agent => agent.extensionPart === null);
  } else if (typeof extensionPart === 'string') {
    results = results.filter(agent => agent.extensionPart === extensionPart);
  }
  // If extensionPart is undefined, no filter is applied for it.
  
  // If specific version requested, filter by version negotiation
  if (requestedVersion && requestedVersion !== "*") { // Treat "*" as matching all versions (i.e., no version filter)
    const suitableAgents = [];
    for (const agent of results) {
        // versionNegotiation expects an array of potential matches for the *same base agent*
        // Here, results are already filtered by other criteria, so we check each one.
        const negotiated = versionNegotiation([agent], requestedVersion);
        if (negotiated) {
            suitableAgents.push(negotiated);
        }
    }
    return suitableAgents;
  }

  return results;
}


export async function renewAgent(
  ansName: string,
  newCertificatePem: string,
  newProtocolExtensionsJson?: string | null, // Changed to allow null
  newActualEndpoint?: string,
  newTtl?: number
): Promise<AgentRecord | null> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName && !agent.isRevoked);
  if (agentIndex === -1) {
    return null;
  }
  agentsDB[agentIndex].certificatePem = newCertificatePem;
  agentsDB[agentIndex].renewalTimestamp = new Date().toISOString();
  if (newProtocolExtensionsJson !== undefined) { // undefined means no change, null means set to null
    agentsDB[agentIndex].protocolExtensionsJson = newProtocolExtensionsJson;
  }
  if (newActualEndpoint !== undefined) {
    agentsDB[agentIndex].actualEndpoint = newActualEndpoint;
  }
  if (newTtl !== undefined) {
    agentsDB[agentIndex].ttl = newTtl;
  }
  console.log(`Renewed agent: ${ansName}`);
  return agentsDB[agentIndex];
}

export async function revokeAgent(ansName: string): Promise<boolean> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName && !agent.isRevoked);
  if (agentIndex === -1) {
     // Agent not found or already revoked
    console.warn(`Attempted to revoke non-existent or already revoked agent: ${ansName}`);
    return false;
  }
  agentsDB[agentIndex].isRevoked = true;
  // In a real system, also update CRL/OCSP
  console.log(`Revoked agent: ${ansName}`);
  return true;
}

// Call initializeDb to populate sample data when this module is loaded
initializeDb();

// Utility to view DB contents for debugging (optional)
export async function getDbSnapshot(): Promise<AgentRecord[]> {
  return JSON.parse(JSON.stringify(agentsDB)); // Return a deep copy
}
