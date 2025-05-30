import { z } from 'zod';

const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const CertificateSchema = z.object({
  subject: z.string().optional(),
  issuer: z.string().optional(),
  pem: z.string().optional(), // PEM format validation will be handled by backend or AI generation step
});

export const AgentRegistrationRequestSchema = z.object({
  protocol: z.enum(["a2a", "mcp", "acp"]).optional(),
  agentID: z.string().optional(),
  agentCapability: z.string().optional(),
  provider: z.string().optional(),
  version: z.string().regex(semanticVersionPattern, "Version must be in Semantic Versioning format.").optional(),
  extension: z.string().optional().nullable(), // Allow null for easier empty state
  certificate: CertificateSchema.optional(),
  protocolExtensions: z.record(z.any()).optional().nullable(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL.").optional(),
});

export const AgentRenewalRequestSchema = z.object({
  ansName: z.string().optional(),
  certificate: CertificateSchema.optional(),
  protocolExtensions: z.record(z.any()).optional().nullable(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL.").optional(),
});

export const AgentRevocationRequestSchema = z.object({
  ansName: z.string().optional(),
});

export const AgentCapabilityRequestSchema = z.object({
  requestType: z.literal("resolve").optional(), // Will default to 'resolve' if not provided
  ansName: z.string().optional(),
  protocol: z.enum(["a2a", "mcp", "acp"]).optional(),
  agentID: z.string().optional(),
  agentCapability: z.string().optional(),
  provider: z.string().optional(),
  version: z.string().optional(),
  extension: z.string().optional().nullable(),
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