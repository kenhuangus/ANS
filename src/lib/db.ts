import type { AgentRecord, Protocol } from '@/types';
import { parseANSName, constructANSName, versionNegotiation } from '@/lib/ans';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData } from '@/lib/pki';

// Mock in-memory database
let agentsDB: AgentRecord[] = [];
let nextId = 1;

export async function initializeDb() {
  // No-op for in-memory, but could load initial data if needed
  console.log("Mock DB initialized.");
  // Add some sample data for testing
  if (agentsDB.length === 0) {
    const sampleAgent1: Omit<AgentRecord, 'id' | 'registrationTimestamp'> = {
      ansName: "a2a://translator.text.ExampleOrg.v1.0.general",
      protocol: "a2a",
      agentIdPart: "translator",
      capability: "text",
      provider: "ExampleOrg",
      version: "1.0",
      extensionPart: "general",
      certificatePem: "-----BEGIN CERTIFICATE-----\nMIIDd...SampleAgent1...CERT\n-----END CERTIFICATE-----",
      protocolExtensionsJson: JSON.stringify({ description: "Translates text using ExampleOrg API" }),
      actualEndpoint: "https://api.example.org/translator/v1",
      renewalTimestamp: null,
      isRevoked: false,
      ttl: 3600,
    };
    await addAgent(sampleAgent1.ansName, sampleAgent1.protocol, sampleAgent1.agentIdPart, sampleAgent1.capability, sampleAgent1.provider, sampleAgent1.version, sampleAgent1.extensionPart, sampleAgent1.certificatePem, sampleAgent1.protocolExtensionsJson, sampleAgent1.actualEndpoint, sampleAgent1.ttl);

     const sampleAgent2: Omit<AgentRecord, 'id' | 'registrationTimestamp'> = {
      ansName: "mcp://sentimentAnalyzer.textAnalysis.ExampleCorp.v1.0",
      protocol: "mcp",
      agentIdPart: "sentimentAnalyzer",
      capability: "textAnalysis",
      provider: "ExampleCorp",
      version: "1.0",
      extensionPart: null,
      certificatePem: "-----BEGIN CERTIFICATE-----\nMIIDd...SampleAgent2...CERT\n-----END CERTIFICATE-----",
      protocolExtensionsJson: JSON.stringify({
        "description": "Analyzes sentiment of text input.",
        "input_schema": { "type": "string", "description": "Text to analyze." },
        "output_schema": { "type": "object", "properties": { "sentiment": { "type": "string", "enum": ["positive", "negative", "neutral"] }, "score": { "type": "number" } } },
        "mcpEndpoint": "https://sentiment.example.com/analyze"
      }),
      actualEndpoint: "https://sentiment.example.com/analyze", // actualEndpoint often matches mcpEndpoint
      renewalTimestamp: null,
      isRevoked: false,
      ttl: 300,
    };
    await addAgent(sampleAgent2.ansName, sampleAgent2.protocol, sampleAgent2.agentIdPart, sampleAgent2.capability, sampleAgent2.provider, sampleAgent2.version, sampleAgent2.extensionPart, sampleAgent2.certificatePem, sampleAgent2.protocolExtensionsJson, sampleAgent2.actualEndpoint, sampleAgent2.ttl);
  }
}

export async function addAgent(
  ansName: string,
  protocol: Protocol,
  agentIdPart: string,
  capability: string,
  provider: string,
  version: string, // e.g. "1.0" or "1.0.beta"
  extensionPart: string | null,
  certificatePem: string,
  protocolExtensionsJson: string | null,
  actualEndpoint: string,
  ttl: number = 300
): Promise<AgentRecord> {
  if (agentsDB.find(agent => agent.ansName === ansName)) {
    throw new Error(`Agent with ANSName "${ansName}" already exists.`);
  }
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
  if (extensionPart) results = results.filter(agent => agent.extensionPart === extensionPart);
  
  // If specific version requested, filter by version negotiation
  if (requestedVersion) {
    const suitableAgents = [];
    for (const agent of results) {
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
  newProtocolExtensionsJson?: string | null,
  newActualEndpoint?: string
): Promise<AgentRecord | null> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName && !agent.isRevoked);
  if (agentIndex === -1) {
    return null;
  }
  agentsDB[agentIndex].certificatePem = newCertificatePem;
  agentsDB[agentIndex].renewalTimestamp = new Date().toISOString();
  if (newProtocolExtensionsJson !== undefined) {
    agentsDB[agentIndex].protocolExtensionsJson = newProtocolExtensionsJson;
  }
  if (newActualEndpoint !== undefined) {
    agentsDB[agentIndex].actualEndpoint = newActualEndpoint;
  }
  return agentsDB[agentIndex];
}

export async function revokeAgent(ansName: string): Promise<boolean> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName);
  if (agentIndex === -1) {
    return false;
  }
  agentsDB[agentIndex].isRevoked = true;
  // In a real system, also update CRL/OCSP
  return true;
}

// Call initializeDb to populate sample data when this module is loaded
initializeDb();
