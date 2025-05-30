
'use server';
/**
 * @fileOverview A Genkit flow to assist in generating details for agent registration.
 *
 * - generateRegistrationDetails - A function that completes partial agent registration data.
 * - GenerateRegistrationDetailsInput - The input type (partial agent registration data). (Imported from lib/schemas)
 * - GenerateRegistrationDetailsOutput - The output type (completed agent registration data). (Imported from lib/schemas)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // z from genkit is fine for schema definitions for genkit components
import { 
  GenerateRegistrationDetailsInputSchema, 
  type GenerateRegistrationDetailsInput,
  GenerateRegistrationDetailsOutputSchema,
  type GenerateRegistrationDetailsOutput,
  semanticVersionPattern // Import for validation
} from '@/lib/schemas';
import { ZodError } from 'zod'; // Import ZodError for type checking

export type { GenerateRegistrationDetailsInput, GenerateRegistrationDetailsOutput };

export async function generateRegistrationDetails(input: GenerateRegistrationDetailsInput): Promise<GenerateRegistrationDetailsOutput> {
  return generateRegistrationDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRegistrationDetailsPrompt',
  input: {schema: GenerateRegistrationDetailsInputSchema},
  output: {schema: GenerateRegistrationDetailsOutputSchema}, // This schema is for the AI's output structure.
  prompt: `You are an expert assistant helping a user register an AI agent for the Agent Name Service (ANS).
The user has provided some initial details for the agent. Your task is to complete any missing information to form a full registration request that conforms to the GenerateRegistrationDetailsOutputSchema.

Current Input:
{{{json input}}}

Instructions for filling missing fields:
1.  **protocol**: If missing OR AN EMPTY STRING, default to 'a2a'. Other valid values are 'mcp', 'acp'.
2.  **agentID**: If missing OR AN EMPTY STRING, generate a plausible, concise, camelCased or PascalCased string. Examples: 'imageProcessor', 'documentTranslator', 'weatherReporter'. Base it on other provided info if available.
3.  **agentCapability**: If missing OR AN EMPTY STRING, generate a plausible, concise, camelCased or PascalCased string related to the agentID. Examples: 'ResizeImage', 'TranslateText', 'GetCurrentWeather'.
4.  **provider**: If missing OR AN EMPTY STRING, generate a plausible, concise, PascalCased company or organization name. Examples: 'CloudServicesInc', 'OpenSourceOrg', 'AcmeCorp'.
5.  **version**: If missing OR AN EMPTY STRING, generate a semantic version like '1.0.0' or '0.1.0'. It MUST conform to semantic versioning.
6.  **extension**: If missing, null, OR AN EMPTY STRING that should be treated as absent, set to null or generate a common one like 'generic' or 'test'. Keep it short. If an empty string is semantically meaningful and different from null, preserve it if appropriate. Generally, prefer null for absence.
7.  **certificate.subject**: If missing OR AN EMPTY STRING, generate a plausible Distinguished Name (DN) string. Example: 'CN=ai-agent.some-provider.com,O=SomeProvider,C=US'. Ensure 'O' (Organization) aligns with the 'provider' field if generated/present. 'CN' should be unique and relevant.
8.  **certificate.pem**: If missing OR AN EMPTY STRING, generate a realistic-looking (but fake and non-functional) PEM-encoded Certificate SigningRequest (CSR).
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
10. **actualEndpoint**: If missing OR AN EMPTY STRING, generate a plausible HTTPS URL. Example: 'https://api.some-provider.com/agents/agent-id/v1'. Make it consistent with other generated fields. It MUST be a valid URL.
11. **protocolExtensions**:
    - If missing, null, OR AN EMPTY OBJECT, create a JSON object with at least a 'description' field.
    - The 'description' should be a short sentence describing the agent's likely purpose based on its ID and capability. Example: \`{"description": "An agent that processes images by resizing them."}\`.
    - If other protocol-specific extensions make sense (e.g., for 'mcp', an 'mcpToolId'), you can add them.
    - Ensure the output for protocolExtensions is a valid JSON object.

Adhere strictly to the output schema format (GenerateRegistrationDetailsOutputSchema). Ensure all generated string values are concise and use appropriate casing (camelCase/PascalCase) for identifiers as conventional.
If a field is already provided by the user in the input (and is not just an empty string that needs completion), DO NOT overwrite it unless it's an empty string and the instructions suggest a default or generation. Prefer user's input if valid and non-empty.
The final output MUST be a complete JSON object matching GenerateRegistrationDetailsOutputSchema.
`,
});

const generateRegistrationDetailsFlow = ai.defineFlow(
  {
    name: 'generateRegistrationDetailsFlow',
    inputSchema: GenerateRegistrationDetailsInputSchema,
    outputSchema: GenerateRegistrationDetailsOutputSchema, // Final output must conform to this
  },
  async (input) => {
    const cleanedInput = JSON.parse(JSON.stringify(input || {}));
    
    const {output} = await prompt(cleanedInput);
    if (!output) {
      throw new Error("AI failed to generate registration details.");
    }

    // --- Post-processing and Fallbacks for critical fields ---

    // Ensure 'protocol' is set if AI misses it
    if (!output.protocol) {
        output.protocol = 'a2a'; 
    }
    
    // Ensure 'version' is a valid semantic version
    if (!output.version || !semanticVersionPattern.test(output.version)) {
        output.version = '0.1.0'; // Default if AI fails to provide a valid one
        console.warn("AI did not provide a valid version. Defaulting to 0.1.0.");
    }

    // Ensure 'actualEndpoint' is a valid URL
    const endpointValidation = z.string().url().safeParse(output.actualEndpoint);
    if (!output.actualEndpoint || !endpointValidation.success) {
        output.actualEndpoint = `https://ai.example.com/${output.provider || 'provider'}/${output.agentID || 'agent'}/${output.version || 'v0'}`;
        console.warn(`AI did not provide a valid actualEndpoint. Defaulting to: ${output.actualEndpoint}`);
    }
    
    // Ensure 'certificate' object and its fields exist if needed by schema
    // GenerateRegistrationDetailsOutputSchema makes `certificate` required.
    // Its sub-fields (subject, pem, issuer) are optional strings in CertificateSchema.
    // The prompt asks AI to generate them if missing/empty.
    if (!output.certificate) {
        output.certificate = {}; // Ensure certificate object exists
    }
    if (typeof output.certificate.subject !== 'string') output.certificate.subject = `CN=${output.agentID || 'unknown'}.agent.example.com,O=${output.provider || 'UnknownProvider'},C=US`;
    if (typeof output.certificate.pem !== 'string' || output.certificate.pem.trim() === '') {
        output.certificate.pem = `-----BEGIN CERTIFICATE REQUEST-----\nMIICVDCCATwCAQAwWDELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0NvbG9yYWRvMQ8w\nDQYDVQQHDAZEZW52ZXIxDTALBgNVBAoMBEFjbWUxEjAQBgNVBAMMCW15YWdlbnQu\nY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvEoM9kws+p2X\n...\n-----END CERTIFICATE REQUEST-----`;
    }
    // issuer is optional, can leave as is or default if empty and desired
    // if (typeof output.certificate.issuer !== 'string') output.certificate.issuer = "CN=Mock CA";


    // Ensure 'protocolExtensions' is an object and has a description
    if (typeof output.protocolExtensions === 'string') {
        try {
            output.protocolExtensions = JSON.parse(output.protocolExtensions as string);
        } catch (e) {
            console.warn("AI returned string for protocolExtensions, but it's not valid JSON. Setting to default.", e);
            output.protocolExtensions = { description: "Error parsing AI-generated protocolExtensions." };
        }
    }

    if (typeof output.protocolExtensions !== 'object' || output.protocolExtensions === null) {
      output.protocolExtensions = { description: `Default agent description for ${output.agentID || 'agent'}.` };
    } else {
      if (!output.protocolExtensions.description || String(output.protocolExtensions.description).trim() === "") {
        output.protocolExtensions.description = `Agent for ${output.agentID || 'general purposes'} performing ${output.agentCapability || 'tasks'}.`;
      }
    }

    // Fill other potentially empty strings that the schema makes required (but allows empty string)
    // if AI didn't fill them as per prompt.
    if (typeof output.agentID !== 'string' || output.agentID.trim() === '') output.agentID = 'defaultAgentID';
    if (typeof output.agentCapability !== 'string' || output.agentCapability.trim() === '') output.agentCapability = 'defaultCapability';
    if (typeof output.provider !== 'string' || output.provider.trim() === '') output.provider = 'DefaultProvider';
    // 'extension' can be null or string. If AI returns "", it's a string, which is fine.

    // --- End of Post-processing ---

    // Validate against the GenerateRegistrationDetailsOutputSchema before returning
    // This schema ensures all required fields are present and correctly typed.
    try {
        const validation = GenerateRegistrationDetailsOutputSchema.parse(output);
        return validation; // Use the validated and potentially transformed data
    } catch (error) {
        if (error instanceof ZodError) {
            console.error("AI output failed Zod validation after post-processing:", error.format());
            throw new Error(`AI output validation failed: ${JSON.stringify(error.format())}`);
        }
        console.error("Unknown error during Zod validation:", error);
        throw new Error("An unknown error occurred during AI output validation.");
    }
  }
);

    