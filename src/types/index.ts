export type Protocol = "a2a" | "mcp" | "acp";

export interface CertificateInfo {
  subject: string;
  issuer: string;
  pem: string; // For registration, this is CSR. For stored agent, this is the issued cert.
}

export interface AgentRegistrationRequest {
  protocol: Protocol;
  agentID: string;
  agentCapability: string;
  provider: string;
  version: string; // Semantic Versioning
  extension?: string;
  certificate: CertificateInfo; // Contains CSR PEM
  protocolExtensions?: Record<string, any>;
  actualEndpoint: string; // Actual network resolvable endpoint
}

export interface AgentRegistrationResponse {
  ansName: string;
  agentCertificatePem: string; // The CA-signed certificate for the agent
  message: string;
  registrationTimestamp: string;
}

export interface AgentRenewalRequest {
  ansName: string; // Existing ANSName to renew
  certificate: CertificateInfo; // Contains new CSR PEM
  protocolExtensions?: Record<string, any>; // Optional: if extensions need update
  actualEndpoint?: string; // Optional: if endpoint needs update
}

export interface AgentRenewalResponse {
  ansName: string;
  agentCertificatePem: string; // The new CA-signed certificate
  message: string;
  renewalTimestamp: string;
}

export interface AgentRevocationRequest {
  ansName: string;
}

export interface AgentRevocationResponse {
  ansName: string;
  message: string;
  revocationTimestamp: string;
}

export interface AgentCapabilityRequest {
  requestType: "resolve";
  ansName?: string; // Full ANSName for direct lookup
  // OR individual parts for capability-based search
  protocol?: Protocol;
  agentID?: string;
  agentCapability?: string;
  provider?: string;
  version?: string; // Can be a specific version or a range for negotiation
  extension?: string;
}

export interface AgentCapabilityResponse {
  Endpoint: string; // Resolved Agent's ANSName
  actualEndpoint: string; // Actual network address of the resolved agent
  agentCertificatePem: string; // Resolved Agent's Certificate
  registrySignature: string; // Signature by Agent Registry over (Endpoint + actualEndpoint + agentCertificatePem + ttl)
  registryCertificatePem: string; // Agent Registry's Certificate to verify the signature
  ttl: number; // Time-to-live for the resolved record
}

export interface AgentRecord {
  id: number;
  ansName: string;
  protocol: Protocol;
  agentIdPart: string;
  capability: string;
  provider: string;
  version: string;
  extensionPart: string | null;
  certificatePem: string; // Agent's own certificate
  protocolExtensionsJson: string | null;
  actualEndpoint: string; // The actual network address
  registrationTimestamp: string;
  renewalTimestamp: string | null;
  isRevoked: boolean;
  ttl: number;
}
