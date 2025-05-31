import Database from 'better-sqlite3';
import type { AgentRecord, Protocol } from '@/types';
import path from 'path';
import fs from 'fs';

// Define the path for the SQLite database file
const dbDir = path.resolve(process.cwd()); // Project root
const dbPath = path.join(dbDir, 'ans.db');

// Ensure the directory exists (though for root, it always does)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;

function getDbConnection(): Database.Database {
  if (!db) {
    try {
      db = new Database(dbPath, { verbose: console.log }); // Enable verbose logging for DB operations
      console.log(`[DB INFO] Successfully connected to SQLite database at ${dbPath}`);
    } catch (error) {
      console.error('[DB ERROR] Failed to connect to SQLite database:', error);
      throw error; // Rethrow to indicate failure
    }
  }
  return db;
}

// Helper function to convert SQLite row to AgentRecord (handles boolean)
function rowToAgentRecord(row: any): AgentRecord {
  if (!row) return null;
  return {
    ...row,
    isRevoked: Boolean(row.isRevoked),
    extensionPart: row.extensionPart === null ? null : String(row.extensionPart), // Ensure null if DB is null
    protocolExtensionsJson: row.protocolExtensionsJson === null ? null : String(row.protocolExtensionsJson),
    renewalTimestamp: row.renewalTimestamp === null ? null : String(row.renewalTimestamp)
  };
}


export async function initializeDb() {
  const dbInstance = getDbConnection();
  console.log("[DB INFO] Initializing SQLite database schema and sample data...");

  // Create agents table if it doesn't exist
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ansName TEXT UNIQUE NOT NULL,
      protocol TEXT NOT NULL CHECK(protocol IN ('a2a', 'mcp', 'acp')),
      agentIdPart TEXT NOT NULL,
      capability TEXT NOT NULL,
      provider TEXT NOT NULL,
      version TEXT NOT NULL,
      extensionPart TEXT,
      certificatePem TEXT NOT NULL,
      protocolExtensionsJson TEXT,
      actualEndpoint TEXT NOT NULL,
      registrationTimestamp TEXT NOT NULL,
      renewalTimestamp TEXT,
      isRevoked INTEGER NOT NULL DEFAULT 0,
      ttl INTEGER NOT NULL
    );
  `);
  console.log("[DB INFO] 'agents' table schema ensured.");

  // Check if table is empty before inserting sample data
  const countStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM agents');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    console.log("[DB INFO] 'agents' table is empty. Populating with sample data...");
    const commonCertPem = `-----BEGIN CERTIFICATE-----\nMIIDdTCCAl2gAwIBAgIJAJ5dM2VqD3wXMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV\nBAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNV\nBAoMC0V4YW1wbGVPcmcxEjAQBgNVBAMMCWExYS5sb2NhbDAeFw0yNDA1MzAxMjAx\nMTZaFw0yNTA1MzAxMjAxMTZaMFgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEU\nMBIGA1UEBwwLTG9zIEFuZ2VsZXMxFDASBgNVBAoMC0V4YW1wbGVPcmcxEjAQBgNV\nBAMMCWExYS5sb2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALM5\nN7j6qN7T/yP4l9KqY8u4i7P8n6e3V2v7X8r/t9Y8P/w4U3K9N/o7R2m+E9v9Q7x\n+F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB0GA1UdDgQWBBQpY5kO7z4W\ncX8qG3wXk9V7T/yP4jAfBgNVHSMEGDAWgBQpY5kO7z4WcX8qG3wXk9V7T/yP4jAM\nBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBlW4F8QY9g8o8p6D/m8N\n/R9qAgMBAAE=\n-----END CERTIFICATE-----`;
    const sampleAgentsData = [
      { ansName: "a2a://translator.text.ExampleOrg.v1.0.0.general", protocol: "a2a" as Protocol, agentIdPart: "translator", capability: "text", provider: "ExampleOrg", version: "1.0.0", extensionPart: "general", protocolExtensionsJson: JSON.stringify({ description: "A2A agent for text translation.", supportedLanguages: ["en", "es", "fr"], a2aVersion: "1.1" }), actualEndpoint: "https://api.example.org/a2a/translator/v1", ttl: 3600, },
      { ansName: "mcp://sentimentAnalyzer.text-analysis.ExampleCorp.v1.2.0", protocol: "mcp" as Protocol, agentIdPart: "sentimentAnalyzer", capability: "text-analysis", provider: "ExampleCorp", version: "1.2.0", extensionPart: null, protocolExtensionsJson: JSON.stringify({ description: "MCP agent for sentiment analysis of text.", mcpToolId: "sentiment-v1.2" }), actualEndpoint: "https://api.example.corp/mcp/sentiment", ttl: 7200, },
      { ansName: "acp://conciergeBot.interactive-chat.AISolutionsLLC.v0.9.5-beta.hospitality", protocol: "acp" as Protocol, agentIdPart: "conciergeBot", capability: "interactive-chat", provider: "AISolutionsLLC", version: "0.9.5-beta", extensionPart: "hospitality", protocolExtensionsJson: JSON.stringify({ description: "ACP agent for hospitality concierge services.", acpVersion: "1.3", supportedChannels: ["websocket", "grpc"] }), actualEndpoint: "wss://concierge.aisolutions.llc/acp/v1", ttl: 1800, },
      { ansName: "a2a://imageProcessor.image-analysis.MediaServices.v2.1.0.filters", protocol: "a2a" as Protocol, agentIdPart: "imageProcessor", capability: "image-analysis", provider: "MediaServices", version: "2.1.0", extensionPart: "filters", protocolExtensionsJson: JSON.stringify({ description: "A2A agent for image processing and analysis with various filters.", supportedFormats: ["jpg", "png"], maxResolution: "4K" }), actualEndpoint: "https://api.mediaservices.com/a2a/image/filters/v2.1", ttl: 3600 * 24 * 7, },
      { ansName: "mcp://weatherForecaster.data-retrieval.OpenWeatherOrg.v3.0.1", protocol: "mcp" as Protocol, agentIdPart: "weatherForecaster", capability: "data-retrieval", provider: "OpenWeatherOrg", version: "3.0.1", extensionPart: null, protocolExtensionsJson: JSON.stringify({ description: "MCP agent providing weather forecasts.", input_schema: {type: "object", properties: {location: {type: "string"}}}, output_schema: {type: "object", properties: {forecast: {type: "string"}}}}), actualEndpoint: "https://api.openweather.org/mcp/forecast/v3", ttl: 300, },
      { ansName: "acp://supportAssistant.customer-support-chat.HelpDeskInc.v1.5.0.enterprise", protocol: "acp" as Protocol, agentIdPart: "supportAssistant", capability: "customer-support-chat", provider: "HelpDeskInc", version: "1.5.0", extensionPart: "enterprise", protocolExtensionsJson: JSON.stringify({ description: "ACP based enterprise support chat assistant.", supportedIntents: ["password_reset", "ticket_status"], escalationPath: "human_operator" }), actualEndpoint: "https://support.helpdeskinc.com/acp/chat/v1.5", ttl: 1800 * 2, },
      { ansName: "a2a://documentSummarizer.natural-language-processing.ResearchAI.v0.8.0-alpha", protocol: "a2a" as Protocol, agentIdPart: "documentSummarizer", capability: "natural-language-processing", provider: "ResearchAI", version: "0.8.0-alpha", extensionPart: null, protocolExtensionsJson: JSON.stringify({ description: "A2A Alpha version for document summarization.", maxLength: "5000_words" }), actualEndpoint: "https://dev.research.ai/a2a/summarize/v0.8", ttl: 3600 * 24, },
      { ansName: "mcp://stockTicker.financial-data.MarketWatchLLC.v1.0.0.realtime", protocol: "mcp" as Protocol, agentIdPart: "stockTicker", capability: "financial-data", provider: "MarketWatchLLC", version: "1.0.0", extensionPart: "realtime", protocolExtensionsJson: JSON.stringify({ description: "MCP agent for real-time stock ticker data.", symbols: ["AAPL", "GOOGL", "MSFT"] }), actualEndpoint: "https://data.marketwatch.llc/mcp/stock/realtime", ttl: 60, },
      { ansName: "acp://iotController.device-control.SmartHomeSystem.v2.2.1.lighting", protocol: "acp" as Protocol, agentIdPart: "iotController", capability: "device-control", provider: "SmartHomeSystem", version: "2.2.1", extensionPart: "lighting", protocolExtensionsJson: JSON.stringify({ description: "ACP agent to control smart lighting devices.", commands: ["on", "off", "brightness", "color"] }), actualEndpoint: "mqtt://smarthome.system/acp/devices/lighting", ttl: 86400, },
      { ansName: "a2a://codeGenerator.developer-tool.CodeGenX.v1.1.0.python", protocol: "a2a" as Protocol, agentIdPart: "codeGenerator", capability: "developer-tool", provider: "CodeGenX", version: "1.1.0", extensionPart: "python", protocolExtensionsJson: JSON.stringify({ description: "A2A agent that generates Python code snippets.", templateLibrary: "standard" }), actualEndpoint: "https://api.codegenx.com/a2a/generate/python/v1.1", ttl: 3600 * 3, },
      { ansName: "mcp://newsAggregator.content-aggregation.NewsHub.v1.0.0.global", protocol: "mcp" as Protocol, agentIdPart: "newsAggregator", capability: "content-aggregation", provider: "NewsHub", version: "1.0.0", extensionPart: "global", protocolExtensionsJson: JSON.stringify({ description: "MCP agent for aggregating global news.", categories: ["technology", "business", "world"] }), actualEndpoint: "https://api.newshub.com/mcp/articles", ttl: 900, },
    ];

    const insertStmt = dbInstance.prepare(`
      INSERT INTO agents (
        ansName, protocol, agentIdPart, capability, provider, version, extensionPart,
        certificatePem, protocolExtensionsJson, actualEndpoint, registrationTimestamp,
        renewalTimestamp, isRevoked, ttl
      ) VALUES (
        @ansName, @protocol, @agentIdPart, @capability, @provider, @version, @extensionPart,
        @certificatePem, @protocolExtensionsJson, @actualEndpoint, @registrationTimestamp,
        NULL, 0, @ttl
      )
    `);

    dbInstance.transaction((agents) => {
      for (const agentData of agents) {
        insertStmt.run({
          ...agentData,
          certificatePem: commonCertPem,
          registrationTimestamp: new Date().toISOString(),
        });
      }
    })(sampleAgentsData);
    console.log(`[DB INFO] Sample data populated. Total sample agents inserted: ${sampleAgentsData.length}.`);
  } else {
    console.log(`[DB INFO] 'agents' table already contains data (${result.count} records). Skipping sample data population.`);
  }
}

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
  ttl: number = 2592000 // Default 30 days
): Promise<AgentRecord> {
  const dbInstance = getDbConnection();

  const findActiveStmt = dbInstance.prepare('SELECT * FROM agents WHERE ansName = ? AND isRevoked = 0');
  const existingActiveAgentRow = findActiveStmt.get(ansName);

  if (existingActiveAgentRow) {
    console.warn(`[DB WARN] Agent with ANSName "${ansName}" already actively registered. Returning existing.`);
    return rowToAgentRecord(existingActiveAgentRow);
  }

  const registrationTimestamp = new Date().toISOString();
  const insertStmt = dbInstance.prepare(`
    INSERT INTO agents (
      ansName, protocol, agentIdPart, capability, provider, version, extensionPart,
      certificatePem, protocolExtensionsJson, actualEndpoint, registrationTimestamp,
      renewalTimestamp, isRevoked, ttl
    ) VALUES (
      @ansName, @protocol, @agentIdPart, @capability, @provider, @version, @extensionPart,
      @certificatePem, @protocolExtensionsJson, @actualEndpoint, @registrationTimestamp,
      NULL, 0, @ttl
    ) RETURNING id;
  `);

  try {
    const result = insertStmt.run({
      ansName, protocol, agentIdPart, capability, provider, version, extensionPart,
      certificatePem, protocolExtensionsJson, actualEndpoint, registrationTimestamp, ttl
    });
    
    // Fetch the newly inserted agent to return the complete record
    const getNewAgentStmt = dbInstance.prepare('SELECT * FROM agents WHERE id = ?');
    const newAgentRow = getNewAgentStmt.get(result.lastInsertRowid);

    console.log(`[DB INFO] Added agent: ${ansName}, ID: ${result.lastInsertRowid}. Timestamp: ${registrationTimestamp}`);
    console.log(`[DB DEBUG] Last added agent details:`, JSON.stringify(rowToAgentRecord(newAgentRow), null, 2));
    return rowToAgentRecord(newAgentRow);

  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.error(`[DB ERROR] Failed to add agent. ANSName "${ansName}" likely already exists (possibly revoked). If it's revoked and you want to re-register, it should ideally be handled differently (e.g., update revoked record or allow new registration after permanent deletion). Current logic prevents re-inserting a unique ANSName.`);
        // Attempt to find if it's a revoked one or some other constraint
        const findAnyStmt = dbInstance.prepare('SELECT * FROM agents WHERE ansName = ?');
        const conflictingAgent = findAnyStmt.get(ansName);
        if (conflictingAgent) {
            console.error("[DB ERROR] Conflicting agent:", JSON.stringify(rowToAgentRecord(conflictingAgent)));
            throw new Error(`Agent with ANSName "${ansName}" already exists. Status: ${rowToAgentRecord(conflictingAgent).isRevoked ? 'Revoked' : 'Active'}.`);
        }
    }
    console.error(`[DB ERROR] Failed to add agent ${ansName}:`, error);
    throw error;
  }
}

export async function findAgentByAnsName(ansName: string): Promise<AgentRecord | null> {
  const dbInstance = getDbConnection();
  const stmt = dbInstance.prepare('SELECT * FROM agents WHERE ansName = ? AND isRevoked = 0');
  const row = stmt.get(ansName);
  console.log(`[DB DEBUG] findAgentByAnsName: ansName='${ansName}', found: ${!!row}`);
  return row ? rowToAgentRecord(row) : null;
}

export async function findAgents(searchTerm?: string): Promise<AgentRecord[]> {
  const dbInstance = getDbConnection();
  let rows;
  if (searchTerm && searchTerm.trim() !== "") {
    const lowerSearchTerm = `%${searchTerm.toLowerCase()}%`;
    const stmt = dbInstance.prepare(`
      SELECT * FROM agents 
      WHERE isRevoked = 0 AND (
        LOWER(ansName) LIKE @term OR
        LOWER(agentIdPart) LIKE @term OR
        LOWER(capability) LIKE @term OR
        LOWER(provider) LIKE @term OR
        (extensionPart IS NOT NULL AND LOWER(extensionPart) LIKE @term) OR
        LOWER(version) LIKE @term
      )
    `);
    rows = stmt.all({ term: lowerSearchTerm });
  } else {
    const stmt = dbInstance.prepare('SELECT * FROM agents WHERE isRevoked = 0');
    rows = stmt.all();
  }
  console.log(`[DB DEBUG] findAgents: searchTerm='${searchTerm}', found ${rows.length} agents.`);
  return rows.map(rowToAgentRecord);
}

export async function renewAgent(
  ansName: string,
  newCertificatePem?: string | null,
  newProtocolExtensionsJson?: string | null, // Note: can be null to clear it
  newActualEndpoint?: string,
  newTtl?: number
): Promise<AgentRecord | null> {
  const dbInstance = getDbConnection();
  const renewalTimestamp = new Date().toISOString();
  const currentTtl = newTtl !== undefined ? newTtl : (30 * 24 * 60 * 60); // Default 30 days

  // Build the SET part of the query dynamically
  let setClauses = ['renewalTimestamp = @renewalTimestamp', 'ttl = @currentTtl'];
  const params: any = { ansName, renewalTimestamp, currentTtl };

  if (newCertificatePem !== undefined) { // Check for undefined to distinguish from null
    setClauses.push('certificatePem = @newCertificatePem');
    params.newCertificatePem = newCertificatePem; // Can be null to clear
  }
  if (newProtocolExtensionsJson !== undefined) {
    setClauses.push('protocolExtensionsJson = @newProtocolExtensionsJson');
    params.newProtocolExtensionsJson = newProtocolExtensionsJson; // Can be null
  }
  if (newActualEndpoint !== undefined) {
    setClauses.push('actualEndpoint = @newActualEndpoint');
    params.newActualEndpoint = newActualEndpoint;
  }

  const stmt = dbInstance.prepare(`
    UPDATE agents 
    SET ${setClauses.join(', ')}
    WHERE ansName = @ansName AND isRevoked = 0
  `);
  
  const result = stmt.run(params);

  if (result.changes === 0) {
    console.warn(`[DB WARN] Renewal failed or no changes made: Agent ${ansName} not found or is revoked.`);
    return null;
  }
  
  console.log(`[DB INFO] Renewed agent: ${ansName}. New TTL: ${currentTtl}s. Renewal Timestamp: ${renewalTimestamp}. Changes: ${result.changes}`);
  const findUpdatedStmt = dbInstance.prepare('SELECT * FROM agents WHERE ansName = ?');
  const updatedRow = findUpdatedStmt.get(ansName);
  return rowToAgentRecord(updatedRow);
}

export async function revokeAgent(ansName: string): Promise<boolean> {
  const dbInstance = getDbConnection();
  const revocationTimestamp = new Date().toISOString();
  const stmt = dbInstance.prepare(`
    UPDATE agents 
    SET isRevoked = 1, renewalTimestamp = @revocationTimestamp 
    WHERE ansName = @ansName AND isRevoked = 0
  `);
  const result = stmt.run({ ansName, revocationTimestamp });

  if (result.changes === 0) {
    console.warn(`[DB WARN] Revocation failed: Agent ${ansName} not found or already revoked.`);
    return false;
  }
  console.log(`[DB INFO] Revoked agent: ${ansName}. Revocation status set to true.`);
  return true;
}

export async function getDisplayableAgents(limit: number = 10): Promise<AgentRecord[]> {
  const dbInstance = getDbConnection();
  console.log(`[DB DEBUG] getDisplayableAgents called. Fetching up to ${limit} agents from SQLite.`);
  
  const stmt = dbInstance.prepare(`
    SELECT * FROM agents 
    ORDER BY registrationTimestamp DESC, id DESC 
    LIMIT @limit
  `);
  const rows = stmt.all({ limit });
  
  const displayable = rows.map(rowToAgentRecord);
  console.log(`[DB DEBUG] getDisplayableAgents: Returning ${displayable.length} agents for display AFTER sorting and limiting from SQLite.`);
  return displayable;
}

export async function getDbSnapshot(): Promise<AgentRecord[]> {
  const dbInstance = getDbConnection();
  console.log("[DB DEBUG] getDbSnapshot called. Returning current agents table content from SQLite.");
  const stmt = dbInstance.prepare('SELECT * FROM agents');
  const rows = stmt.all();
  return rows.map(rowToAgentRecord);
}

// Ensure DB is initialized when this module is loaded
// This might run multiple times in dev due to HMR, but CREATE TABLE IF NOT EXISTS handles it.
// The sample data insertion is also guarded.
try {
    initializeDb();
} catch (error) {
    console.error("[DB CRITICAL] Failed to initialize database on module load:", error);
    // Depending on the app's needs, you might want to exit or have a fallback.
    // For now, we'll log and let it proceed; operations will fail if DB is not usable.
}
