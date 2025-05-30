
'use server';

import { 
  generateRegistrationDetails, 
  type GenerateRegistrationDetailsInput,
  type GenerateRegistrationDetailsOutput
} from '@/ai/flows/generate-registration-details-flow';
import { 
  generateRenewalDetails, 
  type GenerateRenewalDetailsInput,
  type GenerateRenewalDetailsOutput
} from '@/ai/flows/generate-renewal-details-flow';
import { 
  generateLookupDetails, 
  type GenerateLookupDetailsInput,
  type GenerateLookupDetailsOutput
} from '@/ai/flows/generate-lookup-details-flow';

export async function aiFillRegistrationDetailsAction(
  input: GenerateRegistrationDetailsInput
): Promise<GenerateRegistrationDetailsOutput | { error: string }> {
  try {
    const result = await generateRegistrationDetails(input);
    return result;
  } catch (error) {
    console.error("AI Fill Registration Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown AI error occurred during registration detail generation.";
    return { error: errorMessage };
  }
}

export async function aiFillRenewalDetailsAction(
  input: GenerateRenewalDetailsInput
): Promise<GenerateRenewalDetailsOutput | { error: string }> {
  try {
    // Ensure ansName is present before calling the flow, as the flow expects it.
    if (!input.ansName || input.ansName.trim() === "") {
        return { error: "ANSName is required to generate renewal details with AI." };
    }
    const result = await generateRenewalDetails(input);
    return result;
  } catch (error) {
    console.error("AI Fill Renewal Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown AI error occurred during renewal detail generation.";
    return { error: errorMessage };
  }
}

export async function aiFillLookupDetailsAction(
  input: GenerateLookupDetailsInput
): Promise<GenerateLookupDetailsOutput | { error: string }> {
  try {
    const result = await generateLookupDetails(input);
    return result;
  } catch (error) {
    console.error("AI Fill Lookup Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown AI error occurred during lookup detail generation.";
    return { error: errorMessage };
  }
}
