'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent renewal.
 *
 * - generateRenewalDetails - A function that completes partial agent renewal data.
 * - GenerateRenewalDetailsInput - The input type (partial agent renewal data). (Imported from lib/schemas)
 * - GenerateRenewalDetailsOutput - The output type (completed agent renewal data). (Imported from lib/schemas)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  GenerateRenewalDetailsInputSchema, 
  type GenerateRenewalDetailsInput,
  GenerateRenewalDetailsOutputSchema,
  type GenerateRenewalDetailsOutput
} from '@/lib/schemas';

export type { GenerateRenewalDetailsInput, GenerateRenewalDetailsOutput };

export async function generateRenewalDetails(input: GenerateRenewalDetailsInput): Promise<GenerateRenewalDetailsOutput> {
  if (!input.ansName) {
    // The AI prompt can try to generate one if missing, but for renewal, ansName is key.
    // For now, we let the AI attempt it, but usually, it should be user-provided for renewal.
    // This check can be re-evaluated based on desired AI behavior.
  }
  return generateRenewalDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRenewalDetailsPrompt',
  input: {schema: GenerateRenewalDetailsInputSchema},
  output: {schema: GenerateRenewalDetailsOutputSchema},
  prompt: `You are an expert assistant helping a user renew an AI agent's registration for the Agent Name Service (ANS).
The user has provided some details, potentially including the 'ansName'.
Your task is to complete any missing information for the renewal request, conforming to GenerateRenewalDetailsOutputSchema.
If 'ansName' is missing, try to suggest a plausible one based on any other input, otherwise generate a placeholder.
Focus on generating a new certificate (CSR) if its details ('certificate.pem', 'certificate.subject') are missing.

Current Input:
{{{json input}}}

Instructions for filling missing fields:
1.  **ansName**: This field MUST be present in the output. If missing in input, generate a plausible ANSName (e.g., 'a2a://myAgent.service.MyOrg.v1.0').
2.  **certificate.subject**: If missing, generate a plausible Distinguished Name (DN) string appropriate for renewing the agent identified by 'ansName'. Example: 'CN=agent.provider.com,O=Provider,C=US'.
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
5.  **actualEndpoint**: If this field is present in the input but empty, generate a plausible HTTPS URL. If not present in input, generate one consistent with other details (e.g., 'https://api.provider.com/agent/v1.0/renewed').
6.  **protocolExtensions**:
    - If present in the input but an empty object or null, you could suggest adding a 'description' like \`{"description": "Agent renewed with updated certificate."}\`.
    - If not present in the input, generate a minimal \`{"description": "Agent renewed."}\` or default to an empty object.
    - Ensure the output for protocolExtensions is a valid JSON object.

Adhere strictly to the output schema format (GenerateRenewalDetailsOutputSchema).
The final output MUST be a complete JSON object.
If a field (other than certificate details when 'ansName' is provided) is already provided by the user, generally DO NOT overwrite it unless it's empty and instructions suggest a default.
`,
});

const generateRenewalDetailsFlow = ai.defineFlow(
  {
    name: 'generateRenewalDetailsFlow',
    inputSchema: GenerateRenewalDetailsInputSchema,
    outputSchema: GenerateRenewalDetailsOutputSchema,
  },
  async (input) => {
    const cleanedInput = JSON.parse(JSON.stringify(input || {})); 
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
        output.protocolExtensions = {}; 
    }
    
    // Validate against the schema
    const validation = GenerateRenewalDetailsOutputSchema.safeParse(output);
    if (!validation.success) {
        console.error("AI output for renewal failed Zod validation:", validation.error.format());
        throw new Error(`AI renewal output validation failed: ${JSON.stringify(validation.error.format())}`);
    }
    return validation.data;
  }
);