
import type { AgentRecord, Protocol } from '@/types';
import { AGENT_REGISTRY_CERTIFICATE_PEM, AGENT_REGISTRY_PRIVATE_KEY_PEM, signData } from '@/lib/pki';

// Mock in-memory database
let agentsDB: AgentRecord[] = [];
let nextId = 1;

export async function initializeDb() {
  console.log("Mock DB initializing with sample data...");
  
  if (agentsDB.length === 0) {
    const commonCertPem = `-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIJAJ5dM2VqD3wXMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV\nBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNV\nBAoMC0V4YW1wbGVPcmcxEjAQBgNVBAMMCWExYS5sb2NhbDAeFw0yNDA1MzAxMjAx\nMTZaFw0yNTA1MzAxMjAxMTZaMFgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEU\nMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNVBAoMC0V4YW1wbGVPcmcxEjAQBgNV\nBAMMCWExYS5sb2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALM5\nN7j6qN7T/yP4l9KqY8u4i7P8n6e3V2v7X8r/t9Y8P/w4U3K9N/o7R2m+E9v9Q7x\n+F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB0GA1UdDgQWBBQpY5kO7z4W\ncX8qG3wXk9V7T/yP4jAfBgNVHSMEGDAWgBQpY5kO7z4WcX8qG3wXk9V7T/yP4jAM\nBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBlW4F8QY9g8o8p6D/m8N\n/R9qAgMBAAE=\n-----END CERTIFICATE-----`;

    const agentsToCreate = [
      {
        ansName: "a2a://translator.text.ExampleOrg.v1.0.0.general",
        protocol: "a2a" as Protocol, agentIdPart: "translator", capability: "text", provider: "ExampleOrg", version: "1.0.0", extensionPart: "general",
        protocolExtensionsJson: JSON.stringify({ description: "A2A agent for text translation.", supportedLanguages: ["en", "es", "fr"], a2aVersion: "1.1" }),
        actualEndpoint: "https://api.example.org/a2a/translator/v1", ttl: 3600, // 1 hour
      },
      {
        ansName: "mcp://sentimentAnalyzer.text.ExampleCorp.v1.2.0",
        protocol: "mcp" as Protocol, agentIdPart: "sentimentAnalyzer", capability: "text", provider: "ExampleCorp", version: "1.2.0", extensionPart: null,
        protocolExtensionsJson: JSON.stringify({ description: "MCP agent for sentiment analysis.", mcpToolId: "sentiment-v1.2" }),
        actualEndpoint: "https://api.example.corp/mcp/sentiment", ttl: 7200, // 2 hours
      },
      {
        ansName: "acp://conciergeBot.interactive.AISolutionsLLC.v0.9.5-beta.hospitality",
        protocol: "acp" as Protocol, agentIdPart: "conciergeBot", capability: "interactive", provider: "AISolutionsLLC", version: "0.9.5-beta", extensionPart: "hospitality",
        protocolExtensionsJson: JSON.stringify({ description: "ACP agent for hospitality concierge services.", acpVersion: "1.3", supportedChannels: ["websocket", "grpc"] }),
        actualEndpoint: "wss://concierge.aisolutions.llc/acp/v1", ttl: 1800, // 30 minutes
      },
      {
        ansName: "a2a://imageProcessor.image.MediaServices.v2.1.0.filters",
        protocol: "a2a" as Protocol, agentIdPart: "imageProcessor", capability: "image", provider: "MediaServices", version: "2.1.0", extensionPart: "filters",
        protocolExtensionsJson: JSON.stringify({ description: "A2A agent for image processing with various filters.", supportedFormats: ["jpg", "png"], maxResolution: "4K" }),
        actualEndpoint: "https://api.mediaservices.com/a2a/image/filters/v2.1", ttl: 3600 * 24 * 7, // 7 days
      },
      {
        ansName: "mcp://weatherForecaster.data.OpenWeatherOrg.v3.0.1",
        protocol: "mcp" as Protocol, agentIdPart: "weatherForecaster", capability: "data", provider: "OpenWeatherOrg", version: "3.0.1", extensionPart: null,
        protocolExtensionsJson: JSON.stringify({ description: "MCP agent providing weather forecasts.", input_schema: {type: "object", properties: {location: {type: "string"}}}, output_schema: {type: "object", properties: {forecast: {type: "string"}}}}),
        actualEndpoint: "https://api.openweather.org/mcp/forecast/v3", ttl: 300, // 5 minutes
      },
      {
        ansName: "acp://supportAssistant.chat.HelpDeskInc.v1.5.0.enterprise",
        protocol: "acp" as Protocol, agentIdPart: "supportAssistant", capability: "chat", provider: "HelpDeskInc", version: "1.5.0", extensionPart: "enterprise",
        protocolExtensionsJson: JSON.stringify({ description: "ACP based enterprise support chat assistant.", supportedIntents: ["password_reset", "ticket_status"], escalationPath: "human_operator" }),
        actualEndpoint: "https://support.helpdeskinc.com/acp/chat/v1.5", ttl: 1800 * 2, // 1 hour
      },
      {
        ansName: "a2a://documentSummarizer.nlp.ResearchAI.v0.8.0-alpha",
        protocol: "a2a" as Protocol, agentIdPart: "documentSummarizer", capability: "nlp", provider: "ResearchAI", version: "0.8.0-alpha", extensionPart: null,
        protocolExtensionsJson: JSON.stringify({ description: "A2A Alpha version for document summarization.", maxLength: "5000_words" }),
        actualEndpoint: "https://dev.research.ai/a2a/summarize/v0.8", ttl: 3600 * 24, // 1 day
      },
      {
        ansName: "mcp://stockTicker.finance.MarketWatchLLC.v1.0.0.realtime",
        protocol: "mcp" as Protocol, agentIdPart: "stockTicker", capability: "finance", provider: "MarketWatchLLC", version: "1.0.0", extensionPart: "realtime",
        protocolExtensionsJson: JSON.stringify({ description: "MCP agent for real-time stock ticker data.", symbols: ["AAPL", "GOOGL", "MSFT"] }),
        actualEndpoint: "https://data.marketwatch.llc/mcp/stock/realtime", ttl: 60, // 1 minute
      },
      {
        ansName: "acp://iotController.device.SmartHomeSystem.v2.2.1.lighting",
        protocol: "acp" as Protocol, agentIdPart: "iotController", capability: "device", provider: "SmartHomeSystem", version: "2.2.1", extensionPart: "lighting",
        protocolExtensionsJson: JSON.stringify({ description: "ACP agent to control smart lighting devices.", commands: ["on", "off", "brightness", "color"] }),
        actualEndpoint: "mqtt://smarthome.system/acp/devices/lighting", ttl: 86400, // 1 day
      },
      {
        ansName: "a2a://codeGenerator.devtool.CodeGenX.v1.1.0.python",
        protocol: "a2a" as Protocol, agentIdPart: "codeGenerator", capability: "devtool", provider: "CodeGenX", version: "1.1.0", extensionPart: "python",
        protocolExtensionsJson: JSON.stringify({ description: "A2A agent that generates Python code snippets.", templateLibrary: "standard" }),
        actualEndpoint: "https://api.codegenx.com/a2a/generate/python/v1.1", ttl: 3600 * 3, // 3 hours
      },
       {
        ansName: "mcp://newsAggregator.content.NewsHub.v1.0.0.global",
        protocol: "mcp" as Protocol, agentIdPart: "newsAggregator", capability: "content", provider: "NewsHub", version: "1.0.0", extensionPart: "global",
        protocolExtensionsJson: JSON.stringify({ description: "MCP agent for aggregating global news.", categories: ["technology", "business", "world"] }),
        actualEndpoint: "https://api.newshub.com/mcp/articles", ttl: 900, // 15 minutes
      },
    ];

    for (const agentData of agentsToCreate) {
      const existing = agentsDB.find(a => a.ansName === agentData.ansName && !a.isRevoked);
      if (!existing) {
        // Ensure addAgent is awaited if it becomes truly async in the future
        // For now, it's synchronous due to in-memory array operations.
        addAgent(
          agentData.ansName,
          agentData.protocol,
          agentData.agentIdPart,
          agentData.capability,
          agentData.provider,
          agentData.version,
          agentData.extensionPart,
          commonCertPem,
          agentData.protocolExtensionsJson,
          agentData.actualEndpoint,
          agentData.ttl
        );
      }
    }
    console.log(`Mock DB populated. Total agents in DB: ${agentsDB.length}.`);
  }
}

// This function is synchronous as it operates on an in-memory array.
// It's marked async to align with potential future DB implementations.
export async function addAgent(
  ansName: string,
  protocol: Protocol,
  agentIdPart: string,
  capability: string,
  provider: string,
  version: string,
  extensionPart: string | null,
  certificatePem: string,
  protocolExtensionsJson: string | null,
  actualEndpoint: string,
  ttl: number = 300
): Promise<AgentRecord> {
  const existingActiveAgent = agentsDB.find(agent => agent.ansName === ansName && !agent.isRevoked);
  if (existingActiveAgent) {
    console.warn(`Agent with ANSName "${ansName}" already actively registered. Returning existing.`);
    return existingActiveAgent;
  }

  const newAgent: AgentRecord = {
    id: nextId++, // Assign unique ID
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
    registrationTimestamp: new Date().toISOString(), // Set current timestamp
    renewalTimestamp: null,
    isRevoked: false,
    ttl,
  };
  agentsDB.push(newAgent);
  console.log(`Added agent: ${ansName}, ID: ${newAgent.id}. Timestamp: ${newAgent.registrationTimestamp}`);
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
  requestedVersion?: string,
  extensionPart?: string
): Promise<AgentRecord[]> {
  let results = agentsDB.filter(agent => !agent.isRevoked);
  if (protocol) results = results.filter(agent => agent.protocol === protocol);
  if (agentIdPart) results = results.filter(agent => agent.agentIdPart === agentIdPart);
  if (capability) results = results.filter(agent => agent.capability === capability);
  if (provider) results = results.filter(agent => agent.provider === provider);

  if (extensionPart === null) { // Explicitly looking for agents with no extension
    results = results.filter(agent => agent.extensionPart === null);
  } else if (typeof extensionPart === 'string' && extensionPart.trim() !== "") { // Looking for a specific extension
    results = results.filter(agent => agent.extensionPart === extensionPart);
  }
  // If extensionPart is undefined or an empty string, it's ignored (matches all extensions).

  // Version matching logic would go here if needed for findAgents based on requestedVersion.
  // For now, this function is mostly used for attribute-based search without complex version negotiation.
  return results;
}


export async function renewAgent(
  ansName: string,
  newCertificatePem?: string | null,
  newProtocolExtensionsJson?: string | null,
  newActualEndpoint?: string,
  newTtl?: number
): Promise<AgentRecord | null> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName && !agent.isRevoked);
  if (agentIndex === -1) {
    console.warn(`Renewal failed: Agent ${ansName} not found or is revoked.`);
    return null;
  }
  
  const agentToUpdate = agentsDB[agentIndex];
  agentToUpdate.renewalTimestamp = new Date().toISOString();

  if (newCertificatePem) {
    agentToUpdate.certificatePem = newCertificatePem;
  }
  if (newProtocolExtensionsJson !== undefined) {
    agentToUpdate.protocolExtensionsJson = newProtocolExtensionsJson;
  }
  if (newActualEndpoint !== undefined) {
    agentToUpdate.actualEndpoint = newActualEndpoint;
  }
  
  // Default renewal TTL is 30 days if newTtl is not specified, otherwise use newTtl.
  agentToUpdate.ttl = newTtl !== undefined ? newTtl : (30 * 24 * 60 * 60);
  
  console.log(`Renewed agent: ${ansName}. New TTL: ${agentToUpdate.ttl}s. Renewal Timestamp: ${agentToUpdate.renewalTimestamp}`);
  return agentToUpdate;
}

export async function revokeAgent(ansName: string): Promise<boolean> {
  const agentIndex = agentsDB.findIndex(agent => agent.ansName === ansName && !agent.isRevoked);
  if (agentIndex === -1) {
    console.warn(`Revocation failed: Agent ${ansName} not found or already revoked.`);
    return false;
  }
  agentsDB[agentIndex].isRevoked = true;
  // Optionally, clear renewalTimestamp or set a specific revokedTimestamp if needed for display
  // agentsDB[agentIndex].renewalTimestamp = null; 
  console.log(`Revoked agent: ${ansName}`);
  return true;
}

export async function getDisplayableAgents(limit: number = 10): Promise<AgentRecord[]> {
  // Returns all agents (including revoked), sorted to show newest registrations first.
  // The client view handles displaying revoked status.
  const allAgents = [...agentsDB];
  
  // Sort by registrationTimestamp descending (newest first).
  // If timestamps are identical, sort by ID descending (higher ID is newer).
  allAgents.sort((a, b) => {
    const dateA = new Date(a.registrationTimestamp).getTime();
    const dateB = new Date(b.registrationTimestamp).getTime();
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return b.id - a.id; // Higher ID is newer if timestamps are the same
  });
  
  // Return a deep copy of the limited slice to prevent direct mutation of DB objects.
  return JSON.parse(JSON.stringify(allAgents.slice(0, limit)));
}

// Initialize DB with sample data on first load.
initializeDb();

// Helper function for debugging or testing to get a snapshot of the DB.
export async function getDbSnapshot(): Promise<AgentRecord[]> {
  return JSON.parse(JSON.stringify(agentsDB));
}
