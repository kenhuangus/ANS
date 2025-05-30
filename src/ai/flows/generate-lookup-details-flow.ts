
'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent lookup.
 *
 * - generateLookupDetails - A function that completes partial agent lookup data.
 * - GenerateLookupDetailsInput - The input type (partial agent lookup data).
 * - GenerateLookupDetailsOutput - The output type (completed agent lookup data).
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import { AgentCapabilityRequestSchema, type AgentCapabilityRequestPayload } from '@/lib/schemas';
import { constructANSName } from '@/lib/ans';


export const GenerateLookupDetailsInputSchema = AgentCapabilityRequestSchema.partial().describe("Partial agent lookup details provided by the user.");
export type GenerateLookupDetailsInput = z.infer<typeof GenerateLookupDetailsInputSchema>;

export const GenerateLookupDetailsOutputSchema = AgentCapabilityRequestSchema.describe("Completed agent lookup details, with AI-generated or structured values for missing/partial fields.");
export type GenerateLookupDetailsOutput = z.infer<typeof GenerateLookupDetailsOutputSchema>;


export async function generateLookupDetails(input: GenerateLookupDetailsInput): Promise<GenerateLookupDetailsOutput> {
  return generateLookupDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLookupDetailsPrompt',
  input: {schema: GenerateLookupDetailsInputSchema},
  output: {schema: GenerateLookupDetailsOutputSchema},
  prompt: `You are an assistant helping a user look up an AI agent in the Agent Name Service (ANS).
The user has provided some partial information. Your task is to complete or structure this information for a lookup query, conforming to the AgentCapabilityRequestSchema.

Current Input:
{{{json input}}}

Instructions:
1.  **requestType**: Always set this to 'resolve'.
2.  **ansName**:
    *   If 'ansName' is provided, keep it.
    *   If 'ansName' is NOT provided, but all other individual components ('protocol', 'agentID', 'agentCapability', 'provider', 'version') ARE provided and valid, try to construct the 'ansName' using these components. The format is: \`protocol://agentID.agentCapability.provider.vVersion[.extension]\`. The 'extension' part is optional.
    *   If 'ansName' is not provided and some components are missing, leave 'ansName' empty and try to fill the individual components as best as possible.
3.  **Individual Components** ('protocol', 'agentID', 'agentCapability', 'provider', 'version', 'extension'):
    *   If 'ansName' is provided, these fields might be left empty or derived from 'ansName' if you were to parse it (but the primary goal is not parsing here, rather filling if 'ansName' is absent).
    *   If any of these are missing and 'ansName' is also missing or incomplete, try to generate plausible values if there's enough context from other fields.
    *   'protocol': if missing, can suggest 'a2a', 'mcp', or 'acp'.
    *   'version': if missing, suggest '*' (wildcard) or a common version like '1.0'.
    *   'extension': if missing, can be null or an empty string.

Your primary goal is to make the query as complete as possible based on the user's input.
If the user provides an 'ansName', that should be the primary search parameter.
If 'ansName' is absent, then the combination of other attributes is used.

Output MUST conform to AgentCapabilityRequestSchema.
If a field is already provided by the user, generally DO NOT overwrite it.
Prioritize constructing 'ansName' if its components are available and 'ansName' itself is missing.
If very little information is provided (e.g., only 'protocol'), fill in what you can but acknowledge some fields might remain unspecified.
`,
});


const generateLookupDetailsFlow = ai.defineFlow(
  {
    name: 'generateLookupDetailsFlow',
    inputSchema: GenerateLookupDetailsInputSchema,
    outputSchema: GenerateLookupDetailsOutputSchema,
  },
  async (input) => {
    const cleanedInput = JSON.parse(JSON.stringify(input || {}));
    
    // Pre-computation: if ansName is missing but all parts are there, construct it.
    // This helps guide the AI or can be a direct step.
    if (
      !cleanedInput.ansName &&
      cleanedInput.protocol &&
      cleanedInput.agentID &&
      cleanedInput.agentCapability &&
      cleanedInput.provider &&
      cleanedInput.version
    ) {
      // Let the AI do this as per prompt, or construct it here:
      // cleanedInput.ansName = constructANSName({ ... });
      // For now, let AI handle it based on prompt to see its capability.
    }
    
    const {output} = await prompt(cleanedInput);
    if (!output) {
      throw new Error("AI failed to generate lookup details.");
    }

    // Ensure requestType is set
    if (!output.requestType) {
      output.requestType = 'resolve';
    }

    // If AI decided to construct ansName, ensure other fields are consistent or cleared if ansName is the sole lookup method
    if (output.ansName && output.ansName.trim() !== "") {
        // Optionally, if ansName is now populated, we might clear other fields if lookup is by ansName only
        // For now, we'll let the API endpoint decide how to interpret combined ansName + attributes
    }


    const validation = AgentCapabilityRequestSchema.safeParse(output);
    if (!validation.success) {
        console.error("AI output for lookup failed Zod validation:", validation.error.format());
        throw new Error(`AI lookup output validation failed: ${JSON.stringify(validation.error.format())}`);
    }
    return validation.data;
  }
);
