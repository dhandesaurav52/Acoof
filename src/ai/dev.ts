
'use server';
/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It checks for the GOOGLE_API_KEY environment variable and configures the Google AI plugin.
 * If the key is missing, it will throw an error at runtime when an AI feature is used.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// The API key is sourced from the GOOGLE_API_KEY environment variable.
// This configuration works for both local development (from .env) and
// production environments (e.g., Firebase App Hosting with secrets).
export const ai = genkit({
  plugins: [googleAI()],
  // In a production environment, flow state is not stored.
  // In development, it's stored locally.
  flowStateStore: process.env.NODE_ENV === 'production' ? 'none' : 'local',
  // The logger is disabled in production to avoid noisy logs.
  logLevel: process.env.NODE_ENV === 'production' ? 'silent' : 'debug',
});
