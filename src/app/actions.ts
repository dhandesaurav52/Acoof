'use server';

import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';

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
