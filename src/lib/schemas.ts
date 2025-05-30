import { z } from 'zod';

const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const CertificateSchema = z.object({
  subject: z.string().min(1, "Certificate subject is required."),
  issuer: z.string().min(1, "Certificate issuer is required."),
  pem: z.string().min(1, "Certificate PEM (or CSR PEM) is required.").startsWith("-----BEGIN CERTIFICATE REQUEST-----", "Must be a valid CSR PEM format for registration/renewal.")
    .or(z.string().min(1).startsWith("-----BEGIN CERTIFICATE-----", "Must be a valid Certificate PEM format.")),
});

export const AgentRegistrationRequestSchema = z.object({
  protocol: z.enum(["a2a", "mcp", "acp"]),
  agentID: z.string().min(1, "Agent ID is required."),
  agentCapability: z.string().min(1, "Agent Capability is required."),
  provider: z.string().min(1, "Provider is required."),
  version: z.string().regex(semanticVersionPattern, "Version must be in Semantic Versioning format."),
  extension: z.string().optional(),
  certificate: CertificateSchema.refine(data => data.pem.startsWith("-----BEGIN CERTIFICATE REQUEST-----"), {
    message: "Certificate PEM for registration must be a Certificate Signing Request (CSR).",
    path: ["certificate.pem"],
  }),
  protocolExtensions: z.record(z.any()).optional(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL."),
});

export const AgentRenewalRequestSchema = z.object({
  ansName: z.string().min(1, "ANSName is required for renewal."),
  certificate: CertificateSchema.refine(data => data.pem.startsWith("-----BEGIN CERTIFICATE REQUEST-----"), {
    message: "Certificate PEM for renewal must be a Certificate Signing Request (CSR).",
    path: ["certificate.pem"],
  }),
  protocolExtensions: z.record(z.any()).optional(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL.").optional(),
});

export const AgentRevocationRequestSchema = z.object({
  ansName: z.string().min(1, "ANSName is required for revocation."),
});

export const AgentCapabilityRequestSchema = z.object({
  requestType: z.literal("resolve"),
  ansName: z.string().optional(), // Full ANSName for direct lookup
  protocol: z.enum(["a2a", "mcp", "acp"]).optional(),
  agentID: z.string().optional(),
  agentCapability: z.string().optional(),
  provider: z.string().optional(),
  version: z.string().optional(), // Can be a specific version or a range
  extension: z.string().optional(),
}).refine(data => data.ansName || (data.protocol && data.agentID && data.agentCapability && data.provider && data.version), {
  message: "Either a full ANSName or protocol, agentID, capability, provider, and version must be provided for lookup.",
});

// Response schemas are for type checking, not typically for server-side validation of its own responses.
export const AgentRegistrationResponseSchema = z.object({
  ansName: z.string(),
  agentCertificatePem: z.string(),
  message: z.string(),
  registrationTimestamp: z.string().datetime(),
});

export const AgentCapabilityResponseSchema = z.object({
  Endpoint: z.string(), // Resolved Agent's ANSName
  actualEndpoint: z.string().url(),
  agentCertificatePem: z.string(),
  registrySignature: z.string(),
  registryCertificatePem: z.string(),
  ttl: z.number().int().positive(),
});

export type AgentRegistrationRequestPayload = z.infer<typeof AgentRegistrationRequestSchema>;
export type AgentRenewalRequestPayload = z.infer<typeof AgentRenewalRequestSchema>;
export type AgentRevocationRequestPayload = z.infer<typeof AgentRevocationRequestSchema>;
export type AgentCapabilityRequestPayload = z.infer<typeof AgentCapabilityRequestSchema>;
