
'use server';

import { 
  generateRegistrationDetails, 
  type GenerateRegistrationDetailsInput, // Type import
  type GenerateRegistrationDetailsOutput // Type import
} from '@/ai/flows/generate-registration-details-flow';
import { 
  generateRenewalDetails, 
  type GenerateRenewalDetailsInput, // Type import
  type GenerateRenewalDetailsOutput // Type import
} from '@/ai/flows/generate-renewal-details-flow';
import { 
  generateLookupDetails, 
  type GenerateLookupDetailsInput, // Type import
  type GenerateLookupDetailsOutput // Type import
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
    // The Genkit flow's prompt is designed to handle missing ansName by suggesting one.
    // However, for a real renewal, ansName is critical.
    // If AI consistently fails to produce a useful ansName when it's missing,
    // we might re-add a client-side or action-level check.
    // For now, let the flow attempt to fill it.
    // if (!input.ansName || input.ansName.trim() === "") {
    //     return { error: "ANSName is required to generate renewal details with AI. Please provide it or ensure other fields help AI guess it." };
    // }
    const result = await generateRenewalDetails(input);
    return result;
  } catch (error)
