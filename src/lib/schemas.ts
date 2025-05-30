import { z } from 'zod';
import type { Protocol as AgentProtocolType } from '@/types'; // Renamed to avoid conflict

const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const ansNamePattern = /^(a2a|mcp|acp):\/\/([^.]+)\.([^.]+)\.([^.]+)\.v([^.]+)(?:\.([^.]+))?$/;


export const CertificateSchema = z.object({
  subject: z.string().optional(),
  issuer: z.string().optional(),
  pem: z.string().optional(), 
});
export type CertificatePayload = z.infer<typeof CertificateSchema>;

export const AgentRegistrationRequestBaseSchema = z.object({
  protocol: z.enum(["a2a", "mcp", "acp"]).optional(),
  agentID: z.string().optional(),
  agentCapability: z.string().optional(),
  provider: z.string().optional(),
  version: z.string().regex(semanticVersionPattern, "Version must be in Semantic Versioning format.").optional(),
  extension: z.string().optional().nullable(), 
  certificate: CertificateSchema.optional(),
  protocolExtensions: z.record(z.any()).optional().nullable(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL.").optional(),
});
export type AgentRegistrationRequestPayload = z.infer<typeof AgentRegistrationRequestBaseSchema>;


export const AgentRenewalRequestBaseSchema = z.object({
  ansName: z.string().regex(ansNamePattern, "Invalid ANSName format.").optional(),
  certificate: CertificateSchema.optional(),
  protocolExtensions: z.record(z.any()).optional().nullable(),
  actualEndpoint: z.string().url("Actual endpoint must be a valid URL.").optional(),
});
export type AgentRenewalRequestPayload = z.infer<typeof AgentRenewalRequestBaseSchema>;

export const AgentRevocationRequestSchema = z.object({
  ansName: z.string().regex(ansNamePattern, "Invalid ANSName format.").optional(),
});
export type AgentRevocationRequestPayload = z.infer<typeof AgentRevocationRequestSchema>;


export const AgentCapabilityRequestBaseSchema = z.object({
  requestType: z.literal("resolve").optional(), 
  ansName: z.string().regex(ansNamePattern, "Invalid ANSName format if provided.").optional(),
  protocol: z.enum(["a2a", "mcp", "acp"]).optional(),
  agentID: z.string().optional(),
  agentCapability: z.string().optional(),
  provider: z.string().optional(),
  version: z.string().optional(), // Allows semver ranges like "1.x" or "*"
  extension: z.string().optional().nullable(),
});
export type AgentCapabilityRequestPayload = z.infer<typeof AgentCapabilityRequestBaseSchema>;

// Response schemas are for type checking, not typically for server-side validation of its own responses.
export const AgentRegistrationResponseSchema = z.object({
  ansName: z.string(),
  agentCertificatePem: z.string(),
  message: z.string(),
  registrationTimestamp: z.string().datetime(),
});
export type AgentRegistrationResponsePayload = z.infer<typeof AgentRegistrationResponseSchema>;

export const AgentCapabilityResponseSchema = z.object({
  Endpoint: z.string(), 
  actualEndpoint: z.string().url(),
  agentCertificatePem: z.string(),
  registrySignature: z.string(),
  registryCertificatePem: z.string(),
  ttl: z.number().int().positive(),
});
export type AgentCapabilityResponsePayload = z.infer<typeof AgentCapabilityResponseSchema>;


// AI Flow Specific Schemas
// These are derived from the base schemas but used specifically for AI input/output.

// For GenerateRegistrationDetails Flow
export const GenerateRegistrationDetailsInputSchema = AgentRegistrationRequestBaseSchema.partial().describe("Partial agent registration details provided by the user. Empty fields should be filled by the AI.");
export type GenerateRegistrationDetailsInput = z.infer<typeof GenerateRegistrationDetailsInputSchema>;

export const GenerateRegistrationDetailsOutputSchema = AgentRegistrationRequestBaseSchema.required().describe("Completed agent registration details, with AI-generated values for any missing fields. All base fields are now required.");
export type GenerateRegistrationDetailsOutput = z.infer<typeof GenerateRegistrationDetailsOutputSchema>;


// For GenerateRenewalDetails Flow
export const GenerateRenewalDetailsInputSchema = AgentRenewalRequestBaseSchema.partial().describe("Partial agent renewal details provided by the user. User should provide 'ansName'.");
export type GenerateRenewalDetailsInput = z.infer<typeof GenerateRenewalDetailsInputSchema>;

export const GenerateRenewalDetailsOutputSchema = AgentRenewalRequestBaseSchema.required({ansName: true, certificate: true}).describe("Completed agent renewal details. 'ansName' and 'certificate' (with at least PEM) are required. Other fields AI-generated if missing.");
export type GenerateRenewalDetailsOutput = z.infer<typeof GenerateRenewalDetailsOutputSchema>;


// For GenerateLookupDetails Flow
export const GenerateLookupDetailsInputSchema = AgentCapabilityRequestBaseSchema.partial().describe("Partial agent lookup details provided by the user.");
export type GenerateLookupDetailsInput = z.infer<typeof GenerateLookupDetailsInputSchema>;

export const GenerateLookupDetailsOutputSchema = AgentCapabilityRequestBaseSchema.extend({
  requestType: z.literal("resolve").default("resolve") // Ensure requestType is always 'resolve'
}).describe("Completed agent lookup details, with AI-generated or structured values for missing/partial fields.");
export type GenerateLookupDetailsOutput = z.infer<typeof GenerateLookupDetailsOutputSchema>;