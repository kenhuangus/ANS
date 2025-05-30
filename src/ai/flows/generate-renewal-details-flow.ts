
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
  type GenerateRenewalDetailsOutput,
  ansNamePattern // Import for validation
} from '@/lib/schemas';
import { ZodError } from 'zod';

export type { GenerateRenewalDetailsInput, GenerateRenewalDetailsOutput };

export async function generateRenewalDetails(input: GenerateRenewalDetailsInput): Promise<GenerateRenewalDetailsOutput> {
  return generateRenewalDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRenewalDetailsPrompt',
  input: {schema: GenerateRenewalDetailsInputSchema},
  output: {schema: GenerateRenewalDetailsOutputSchema},
  prompt: `You are an expert assistant helping a user renew an AI agent's registration for the Agent Name Service (ANS).
The user has provided some details, potentially including the 'ansName'.
Your task is to complete any missing information for the renewal request, conforming to GenerateRenewalDetailsOutputSchema.
If 'ansName' is missing from input, generate a plausible one based on other input, otherwise generate a placeholder like 'a2a://genericAgent.capability.Provider.v1.0'.
Focus on generating a new certificate (CSR) if its details ('certificate.pem', 'certificate.subject') are missing or empty.

Current Input:
{{{json input}}}

Instructions for filling missing fields:
1.  **ansName**: This field MUST be present in the output and valid. If missing or empty in input, generate a plausible ANSName (e.g., 'a2a://myAgent.service.MyOrg.v1.0'). It must match the ANSName pattern.
2.  **certificate.subject**: If missing or empty, generate a plausible Distinguished Name (DN) string appropriate for renewing the agent identified by 'ansName'. Example: 'CN=agent.provider.com,O=Provider,C=US'. Must be a non-empty string.
3.  **certificate.pem**: If missing or empty, generate a new, realistic-looking (but fake and non-functional) PEM-encoded Certificate Signing Request (CSR) for renewal.
    It MUST start with '-----BEGIN CERTIFICATE REQUEST-----' and end with '-----END CERTIFICATE REQUEST-----'.
    It MUST contain several lines of plausible base64-like characters. Must be a non-empty string.
    Example structure:
    -----BEGIN CERTIFICATE REQUEST-----
    MIIC[...]GVj[...]kTg==
    [...]
    MIIB[...]qGg==
    -----END CERTIFICATE REQUEST-----
4.  **certificate.issuer**: This is optional. If \`certificate.subject\` is generated, you can put a mock CA issuer like 'CN=Local Mock CA,O=Mock CA Org,C=US' or leave it empty.
5.  **actualEndpoint**: If this field is present in the input but empty OR if it's completely missing, generate a plausible HTTPS URL. If present and valid, keep it. Example: 'https://api.provider.com/agent/v1.0/renewed'. It must be a valid URL if provided.
6.  **protocolExtensions**:
    - If missing, null, OR AN EMPTY OBJECT, create a JSON object with at least a 'description' field like \`{"description": "Agent renewed with updated certificate."}\`.
    - If present in the input as a string, try to parse it as JSON. If parsing fails, or it's not an object, create a default.
    - Ensure the output for protocolExtensions is a valid JSON object or null.

Adhere strictly to the output schema format (GenerateRenewalDetailsOutputSchema).
The final output MUST be a complete JSON object.
If a field (other than certificate details when 'ansName' is provided) is already provided by the user and is valid and non-empty, generally DO NOT overwrite it.
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

    // --- Post-processing and Fallbacks ---
    if (typeof output.ansName !== 'string' || !ansNamePattern.test(output.ansName)) {
        output.ansName = 'a2a://defaultAgent.defaultCapability.DefaultProvider.v1.0.0'; // Default if AI fails
        console.warn(`AI did not provide a valid ansName. Original: '${output.ansName}'. Defaulting.`);
    }

    if (!output.certificate) {
        output.certificate = { subject: '', pem: '' };
    }
    if (typeof output.certificate.subject !== 'string' || output.certificate.subject.trim() === '') {
        const parsedAns = output.ansName.match(ansNamePattern);
        const agentName = parsedAns ? parsedAns[2] : 'unknownAgent';
        const providerName = parsedAns ? parsedAns[4] : 'UnknownProvider';
        output.certificate.subject = `CN=${agentName}.agent.example.com,O=${providerName},C=US`;
        console.warn(`AI did not provide a valid certificate subject for renewal. Original: '${output.certificate.subject}'. Defaulting.`);
    }
    if (typeof output.certificate.pem !== 'string' || output.certificate.pem.trim() === '' || !output.certificate.pem.startsWith('-----BEGIN CERTIFICATE REQUEST-----')) {
        output.certificate.pem = `-----BEGIN CERTIFICATE REQUEST-----\nMIICUTCCAToCAQAwWzELMAkGA1UEBhMCVVMxDjAMBgNVBAgMBVRleGFzMQ4wDAYD\nVQQHDAVBdXN0aW4xEzARBgNVBAoMCkV4YW1wbGVDb3JwMRUwEwYDVQQDDAxyZW5l\nd2VkLmFnZW50MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwLmd...RENEWAL...\n-----END CERTIFICATE REQUEST-----`;
        console.warn(`AI did not provide a valid certificate PEM (CSR) for renewal. Original (start): '${output.certificate.pem?.substring(0,30)}'. Defaulting.`);
    }
    // output.certificate.issuer is optional

    if (output.actualEndpoint !== undefined && output.actualEndpoint !== null) {
        if (typeof output.actualEndpoint !== 'string' || output.actualEndpoint.trim() === '') {
            // If AI provides empty string, treat as missing and generate default or make undefined if truly optional.
            // Since schema makes it optional, we can set to undefined if AI gives clearly invalid.
            // However, prompt asks AI to generate if empty/missing.
            const parsedAns = output.ansName.match(ansNamePattern);
            output.actualEndpoint = `https://api.${parsedAns ? parsedAns[4] : 'example'}.com/renewed/${parsedAns ? parsedAns[2] : 'agent'}`;
            console.warn(`AI provided empty/invalid actualEndpoint. Original: '${output.actualEndpoint}'. Defaulting: ${output.actualEndpoint}`);
        } else {
            const endpointValidation = z.string().url().safeParse(output.actualEndpoint);
            if (!endpointValidation.success) {
                const parsedAns = output.ansName.match(ansNamePattern);
                output.actualEndpoint = `https://api.${parsedAns ? parsedAns[4] : 'example'}.com/invalid/${parsedAns ? parsedAns[2] : 'agent'}`;
                console.warn(`AI provided an invalid URL for actualEndpoint. Original: '${output.actualEndpoint}'. Defaulting: ${output.actualEndpoint}`);
            }
        }
    } // If undefined or null, it's fine as it's optional in output schema.

    if (typeof output.protocolExtensions === 'string') {
        try {
            output.protocolExtensions = JSON.parse(output.protocolExtensions as string);
        } catch (e) {
            console.warn("AI returned string for protocolExtensions (renewal), but it's not valid JSON. Setting to default.", e);
            output.protocolExtensions = { description: `Agent ${output.ansName} renewed. Error parsing AI-generated protocolExtensions.`};
        }
    }
    
    if (output.protocolExtensions !== undefined && output.protocolExtensions !== null) {
        if (typeof output.protocolExtensions !== 'object') {
            output.protocolExtensions = { description: `Agent ${output.ansName} renewed. ProtocolExtensions was not an object.` };
            console.warn(`ProtocolExtensions (renewal) was not an object. Defaulting.`);
        } else if (typeof output.protocolExtensions.description !== 'string' || output.protocolExtensions.description.trim() === '') {
            output.protocolExtensions.description = `Agent ${output.ansName} renewed with updated certificate.`;
            console.warn(`ProtocolExtensions (renewal) description was missing/empty. Defaulting.`);
        }
    } else {
        // If it's undefined or null from AI, and the schema allows it (optional().nullable()), it's fine.
        // GenerateRenewalDetailsOutputSchema has protocolExtensions as optional and nullable.
        // However, prompt asks to create a default if missing/null/empty object.
         output.protocolExtensions = { description: `Agent ${output.ansName} renewed. Default protocol extensions.` };
    }
    // --- End of Post-processing ---
    
    try {
        const validation = GenerateRenewalDetailsOutputSchema.parse(output);
        return validation.data;
    } catch (error) {
         if (error instanceof ZodError) {
            console.error("AI output for renewal failed Zod validation after post-processing:", error.format());
            console.error("Problematic AI output object for renewal:", JSON.stringify(output, null, 2));
            throw new Error(`AI renewal output validation failed: ${JSON.stringify(error.format())}`);
        }
        console.error("Unknown error during Zod validation for renewal:", error);
        console.error("Problematic AI output object for renewal (unknown error):", JSON.stringify(output, null, 2));
        throw new Error("An unknown error occurred during AI renewal output validation.");
    }
  }
);
