
'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent renewal.
 *
 * - generateRenewalDetails - A function that completes partial agent renewal data.
 * - GenerateRenewalDetailsInput - The input type (partial agent renewal data).
 * - GenerateRenewalDetailsOutput - The output type (completed agent renewal data).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AgentRenewalRequestSchema, type AgentRenewalRequestPayload } from '@/lib/schemas';

export const GenerateRenewalDetailsInputSchema = AgentRenewalRequestSchema.partial().describe("Partial agent renewal details provided by the user. User must provide 'ansName'.");
export type GenerateRenewalDetailsInput = z.infer<typeof GenerateRenewalDetailsInputSchema>;

export const GenerateRenewalDetailsOutputSchema = AgentRenewalRequestSchema.describe("Completed agent renewal details, with AI-generated values for missing fields like CSR.");
export type GenerateRenewalDetailsOutput = z.infer<typeof GenerateRenewalDetailsOutputSchema>;

export async function generateRenewalDetails(input: GenerateRenewalDetailsInput): Promise<GenerateRenewalDetailsOutput> {
  if (!input.ansName) {
    throw new Error("ANSName is required to generate renewal details.");
  }
  return generateRenewalDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRenewalDetailsPrompt',
  input: {schema: GenerateRenewalDetailsInputSchema},
  output: {schema: GenerateRenewalDetailsOutputSchema},
  prompt: `You are an expert assistant helping a user renew an AI agent's registration for the Agent Name Service (ANS).
The user has provided the 'ansName' and potentially some other details.
Your task is to complete any missing information for the renewal request, primarily focusing on the new certificate (CSR).
The output MUST conform to the AgentRenewalRequestSchema.

Current Input:
{{{json input}}}

Instructions for filling missing fields (especially if 'certificate.pem' or 'certificate.subject' are empty):
1.  **ansName**: This field MUST be present in the input. Do not change it.
2.  **certificate.subject**: If missing, generate a plausible Distinguished Name (DN) string that would be appropriate for renewing the agent identified by 'ansName'. Example: 'CN=agent.provider.com,O=Provider,C=US'. It should ideally be consistent with the existing registration if known, or a new sensible subject.
3.  **certificate.pem**: If missing, generate a new, realistic-looking (but fake and non-functional) PEM-encoded Certificate Signing Request (CSR) for renewal.
    It MUST start with '-----BEGIN CERTIFICATE REQUEST-----' and end with '-----END CERTIFICATE REQUEST-----'.
    It MUST contain several lines of plausible base64-like characters.
    Example structure:
    -----BEGIN CERTIFICATE REQUEST-----
    MIIC[...]GVj[...]kTg==
    [...]
    MIIB[...]qGg==
    -----END CERTIFICATE REQUEST-----
4.  **certificate.issuer**: Similar to registration, you can put a mock CA issuer like 'CN=Local Mock CA,O=Mock CA Org,C=US' or leave it empty.
5.  **actualEndpoint**: If this field is present in the input but empty, you can suggest a plausible new HTTPS URL or leave it as is if the user might want to keep the old one. If not present in input, generate one if it seems appropriate for a renewal (e.g., a new version in the path).
6.  **protocolExtensions**:
    - If present in the input but an empty object or null, you could suggest adding a 'description' like \`{"description": "Agent renewed with updated certificate."}\` or leave it.
    - If not present in the input, you can generate a minimal \`{"description": "Agent renewed."}\` or leave it empty.
    - Ensure the output for protocolExtensions is a valid JSON object.

Adhere strictly to the output schema format.
The final output MUST be a complete JSON object matching AgentRenewalRequestSchema.
If a field (other than certificate details) is already provided by the user, generally DO NOT overwrite it.
`,
});

const generateRenewalDetailsFlow = ai.defineFlow(
  {
    name: 'generateRenewalDetailsFlow',
    inputSchema: GenerateRenewalDetailsInputSchema,
    outputSchema: GenerateRenewalDetailsOutputSchema,
  },
  async (input) => {
    const cleanedInput = JSON.parse(JSON.stringify(input || {})); // Ensure clean object
    const {output} = await prompt(cleanedInput);
    if (!output) {
      throw new Error("AI failed to generate renewal details.");
    }

    if (output.protocolExtensions && typeof output.protocolExtensions === 'string') {
        try {
            output.protocolExtensions = JSON.parse(output.protocolExtensions as string);
        } catch (e) {
            console.warn("AI returned string for protocolExtensions (renewal), but it's not valid JSON. Setting to empty object.", e);
            output.protocolExtensions = { description: "AI failed to generate valid JSON for protocolExtensions during renewal."};
        }
    } else if (output.protocolExtensions === null || output.protocolExtensions === undefined) {
        output.protocolExtensions = {}; // Default to empty object if null/undefined
    }
    
    // Validate against the schema
    const validation = AgentRenewalRequestSchema.safeParse(output);
    if (!validation.success) {
        console.error("AI output for renewal failed Zod validation:", validation.error.format());
        throw new Error(`AI renewal output validation failed: ${JSON.stringify(validation.error.format())}`);
    }
    return validation.data;
  }
);
