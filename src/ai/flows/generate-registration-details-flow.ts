'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent registration.
 *
 * - generateRegistrationDetails - A function that completes partial agent registration data.
 * - GenerateRegistrationDetailsInput - The input type (partial agent registration data). (Imported from lib/schemas)
 * - GenerateRegistrationDetailsOutput - The output type (completed agent registration data). (Imported from lib/schemas)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  GenerateRegistrationDetailsInputSchema, 
  type GenerateRegistrationDetailsInput,
  GenerateRegistrationDetailsOutputSchema,
  type GenerateRegistrationDetailsOutput,
  AgentRegistrationRequestBaseSchema // Base schema for validation
} from '@/lib/schemas';

export type { GenerateRegistrationDetailsInput, GenerateRegistrationDetailsOutput };

export async function generateRegistrationDetails(input: GenerateRegistrationDetailsInput): Promise<GenerateRegistrationDetailsOutput> {
  return generateRegistrationDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRegistrationDetailsPrompt',
  input: {schema: GenerateRegistrationDetailsInputSchema},
  output: {schema: GenerateRegistrationDetailsOutputSchema},
  prompt: `You are an expert assistant helping a user register an AI agent for the Agent Name Service (ANS).
The user has provided some initial details for the agent. Your task is to complete any missing information to form a full registration request that conforms to the GenerateRegistrationDetailsOutputSchema.

Current Input:
{{{json input}}}

Instructions for filling missing fields:
1.  **protocol**: If missing, default to 'a2a'. Other valid values are 'mcp', 'acp'.
2.  **agentID**: If missing, generate a plausible, concise, camelCased or PascalCased string. Examples: 'imageProcessor', 'documentTranslator', 'weatherReporter'. Base it on other provided info if available.
3.  **agentCapability**: If missing, generate a plausible, concise, camelCased or PascalCased string related to the agentID. Examples: 'ResizeImage', 'TranslateText', 'GetCurrentWeather'.
4.  **provider**: If missing, generate a plausible, concise, PascalCased company or organization name. Examples: 'CloudServicesInc', 'OpenSourceOrg', 'AcmeCorp'.
5.  **version**: If missing, generate a semantic version like '1.0.0' or '0.1.0'.
6.  **extension**: If missing or null, you can leave it as null or generate a common one like 'generic', 'test'. Keep it short.
7.  **certificate.subject**: If missing, generate a plausible Distinguished Name (DN) string. Example: 'CN=ai-agent.some-provider.com,O=SomeProvider,C=US'. Ensure 'O' (Organization) aligns with the 'provider' field if generated/present. 'CN' should be unique and relevant.
8.  **certificate.pem**: If missing, generate a realistic-looking (but fake and non-functional) PEM-encoded Certificate SigningRequest (CSR).
    It MUST start with '-----BEGIN CERTIFICATE REQUEST-----' and end with '-----END CERTIFICATE REQUEST-----'.
    It MUST contain several lines of plausible base64-like characters (uppercase, lowercase, numbers, +, /) in between.
    Example structure:
    -----BEGIN CERTIFICATE REQUEST-----
    MIIC[...]GVj[...]kTg==
    [...]
    MIIB[...]qGg==
    -----END CERTIFICATE REQUEST-----
    The content should appear valid for a CSR.
9.  **certificate.issuer**: This field is usually for CA information. For a CSR, it's not strictly part of the request itself but context. If \`certificate.subject\` is generated, you can put a mock CA issuer like 'CN=Local Mock CA,O=Mock CA Org,C=US' or leave it empty if not specified.
10. **actualEndpoint**: If missing, generate a plausible HTTPS URL. Example: 'https://api.some-provider.com/agents/agent-id/v1'. Make it consistent with other generated fields.
11. **protocolExtensions**:
    - If missing or null or an empty object, create a JSON object with at least a 'description' field.
    - The 'description' should be a short sentence describing the agent's likely purpose based on its ID and capability. Example: \`{"description": "An agent that processes images by resizing them."}\`.
    - If other protocol-specific extensions make sense (e.g., for 'mcp', an 'mcpToolId'), you can add them.
    - Ensure the output for protocolExtensions is a valid JSON object.

Adhere strictly to the output schema format (GenerateRegistrationDetailsOutputSchema). Ensure all generated string values are concise and use appropriate casing (camelCase/PascalCase) for identifiers as conventional.
If a field is already provided by the user in the input, DO NOT overwrite it unless it's an empty string and the instructions suggest a default. Prefer user's input.
The final output MUST be a complete JSON object matching GenerateRegistrationDetailsOutputSchema.
`,
});

const generateRegistrationDetailsFlow = ai.defineFlow(
  {
    name: 'generateRegistrationDetailsFlow',
    inputSchema: GenerateRegistrationDetailsInputSchema,
    outputSchema: GenerateRegistrationDetailsOutputSchema,
  },
  async (input) => {
    // Ensure AI gets a clean object, especially for potentially null/undefined fields
    const cleanedInput = JSON.parse(JSON.stringify(input || {}));
    
    const {output} = await prompt(cleanedInput);
    if (!output) {
      throw new Error("AI failed to generate registration details.");
    }
    // Ensure protocolExtensions is an object if it's a string (sometimes AI might return stringified JSON)
    if (output.protocolExtensions && typeof output.protocolExtensions === 'string') {
        try {
            output.protocolExtensions = JSON.parse(output.protocolExtensions as string);
        } catch (e) {
            console.warn("AI returned string for protocolExtensions, but it's not valid JSON. Setting to empty object.", e);
            output.protocolExtensions = { description: "AI failed to generate valid JSON for protocolExtensions."};
        }
    } else if (output.protocolExtensions === null || output.protocolExtensions === undefined) {
        output.protocolExtensions = { description: "Default description added as protocolExtensions was null/undefined."};
    }


    // Validate against the GenerateRegistrationDetailsOutputSchema before returning
    const validation = GenerateRegistrationDetailsOutputSchema.safeParse(output);
    if (!validation.success) {
        console.error("AI output failed Zod validation:", validation.error.format());
        // Attempt to return a partially valid object or throw a more specific error
        // For now, we'll throw, but in production, you might try to salvage parts of the output.
        throw new Error(`AI output validation failed: ${JSON.stringify(validation.error.format())}`);
    }
    return validation.data;
  }
);