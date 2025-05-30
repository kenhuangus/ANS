'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent lookup.
 *
 * - generateLookupDetails - A function that completes partial agent lookup data.
 * - GenerateLookupDetailsInput - The input type (partial agent lookup data). (Imported from lib/schemas)
 * - GenerateLookupDetailsOutput - The output type (completed agent lookup data). (Imported from lib/schemas)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  GenerateLookupDetailsInputSchema, 
  type GenerateLookupDetailsInput,
  GenerateLookupDetailsOutputSchema,
  type GenerateLookupDetailsOutput
} from '@/lib/schemas';
// import { constructANSName } from '@/lib/ans'; // We'll let AI handle construction based on prompt


export type { GenerateLookupDetailsInput, GenerateLookupDetailsOutput };


export async function generateLookupDetails(input: GenerateLookupDetailsInput): Promise<GenerateLookupDetailsOutput> {
  return generateLookupDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLookupDetailsPrompt',
  input: {schema: GenerateLookupDetailsInputSchema},
  output: {schema: GenerateLookupDetailsOutputSchema},
  prompt: `You are an assistant helping a user look up an AI agent in the Agent Name Service (ANS).
The user has provided some partial information. Your task is to complete or structure this information for a lookup query, conforming to the GenerateLookupDetailsOutputSchema.

Current Input:
{{{json input}}}

Instructions:
1.  **requestType**: Always set this to 'resolve'. This is the only supported type.
2.  **ansName**:
    *   If 'ansName' is provided in the input, keep it.
    *   If 'ansName' is NOT provided, but all other individual components ('protocol', 'agentID', 'agentCapability', 'provider', 'version') ARE provided and valid, construct the 'ansName' using these components. The format is: \`protocol://agentID.agentCapability.provider.vVersion[.extension]\`. The 'extension' part is optional and can be omitted if not provided or meaningful.
    *   If 'ansName' is not provided and some components are missing, leave 'ansName' empty or null, and try to fill the individual components as best as possible with plausible defaults.
3.  **Individual Components** ('protocol', 'agentID', 'agentCapability', 'provider', 'version', 'extension'):
    *   If 'ansName' is provided in the input, these fields might be left empty by the user. Do not try to parse them from a user-provided 'ansName'; focus on completing them if 'ansName' is absent from the input.
    *   If any of these are missing and 'ansName' is also missing or incomplete in the input:
        *   'protocol': if missing, suggest 'a2a'. Other valid: 'mcp', 'acp'.
        *   'agentID': if missing, suggest a generic ID like 'genericAgent'.
        *   'agentCapability': if missing, suggest a generic capability like 'generalPurpose'.
        *   'provider': if missing, suggest 'UnknownProvider'.
        *   'version': if missing, suggest '*' (wildcard for any version) or a common version like '1.0'.
        *   'extension': if missing, can be null or an empty string.
4.  Prioritize constructing 'ansName' if its components are available in the input and 'ansName' itself is missing from the input.
5.  If very little information is provided (e.g., only 'protocol'), fill in what you can but acknowledge some fields might remain unspecified or use generic defaults.

Your primary goal is to make the query as complete as possible based on the user's input, adhering to GenerateLookupDetailsOutputSchema.
Output MUST conform to GenerateLookupDetailsOutputSchema.
If a field is already provided by the user, generally DO NOT overwrite it.
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
        
    const {output} = await prompt(cleanedInput);
    if (!output) {
      throw new Error("AI failed to generate lookup details.");
    }

    // Ensure requestType is set, as per schema default in GenerateLookupDetailsOutputSchema
    if (!output.requestType) {
      output.requestType = 'resolve';
    }
    
    const validation = GenerateLookupDetailsOutputSchema.safeParse(output);
    if (!validation.success) {
        console.error("AI output for lookup failed Zod validation:", validation.error.format());
        throw new Error(`AI lookup output validation failed: ${JSON.stringify(validation.error.format())}`);
    }
    return validation.data;
  }
);