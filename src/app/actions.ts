'use server';

import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';

export async function getAiSuggestions(browsingHistory: string, photoDataUri?: string) {
  if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
    const errorMessage = "The AI feature is not configured on the server. The `GOOGLE_API_KEY` is missing from the .env file. Please obtain a key from Google AI Studio and add it to your project's environment variables to enable the AI stylist.";
    console.error(errorMessage);
    return { suggestions: [], error: errorMessage };
  }
  
  try {
    // Dynamically import the flow only when the key exists to prevent build-time errors.
    const { generateOutfitSuggestions } = await import('@/ai/flows/generate-outfit-suggestions');
    const result = await generateOutfitSuggestions({ browsingHistory, photoDataUri });
    if (!result || !result.suggestions) {
      return { suggestions: [], error: 'Received an invalid response from the AI.' };
    }
    return { suggestions: result.suggestions, error: null };
  } catch (error) {
    console.error('AI suggestion generation failed:', error);
    let detailedError = 'Failed to generate suggestions. Please try again later.';
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            detailedError = "The provided AI API key is not valid. Please check it for typos or generate a new one.";
        } else if (error.message.includes('permission')) {
            detailedError = "AI generation failed due to a permission issue. Please ensure the Google AI API is enabled in your cloud project.";
        } else if (error.message.includes('Image generation failed')) {
            detailedError = "The AI created outfit ideas, but failed to generate images. This can be due to safety filters or service load. Please try again."
        }
    }
    return { suggestions: [], error: detailedError };
  }
}

export async function createRazorpayOrder(amount: number, receiptId?: string): Promise<{ id: string; amount: number; currency: string; } | { error: string }> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const errorMessage = "Payment gateway is not configured on the server. One or more Razorpay API keys are missing from the .env file. Please check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both set.";
        return { error: errorMessage };
    }

    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
        return { error: 'The total amount must be at least ₹1.00 to proceed with payment.' };
    }

    try {
        const razorpay = new Razorpay({
            key_id: keyId.trim(),
            key_secret: keySecret.trim(),
        });

        const receipt = receiptId || `receipt_${randomBytes(6).toString('hex')}`;
        
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt,
        };
        
        const order = await razorpay.orders.create(options);

        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error: any) {
        console.error('\n\n--- RAZORPAY ORDER CREATION FAILED ---');
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('--- END OF RAZORPAY ERROR ---\n\n');

        if (error.statusCode === 401) {
            return { error: "Authentication with Razorpay failed (Error 401). This is the most common payment error. It means your API Keys are incorrect. Please double-check the following: 1) Are there any typos or extra spaces in your keys in the .env file? 2) Are you using your 'Test Mode' keys in your code while your Razorpay account is in 'Live Mode' (or vice-versa)? The modes must match." };
        }
        
        const description = error.error?.description || 'An unknown error occurred.';
        return { error: `Failed to create payment order. Gateway response: ${description}` };
    }
}

export async function verifyRazorpayPayment(data: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ success: boolean; error?: string }> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
      console.error("Razorpay secret key not found in .env file");
      return { success: false, error: 'Payment verification is not configured on the server. The secret key is missing.' };
  }
  
  const { orderId, paymentId, signature } = data;
  const body = orderId + "|" + paymentId;
  
  const expectedSignature = createHmac('sha256', keySecret.trim())
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === signature) {
    return { success: true };
  }
  
  return { success: false, error: "Payment verification failed. This means the response from Razorpay could not be trusted. This is often caused by an incorrect 'RAZORPAY_KEY_SECRET'. Please re-verify your secret key for any typos or extra spaces and ensure it matches your account's mode (Test vs. Live)." };
}
