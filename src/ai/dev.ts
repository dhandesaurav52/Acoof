
'use server';
/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It checks for the GOOGLE_API_KEY environment variable and configures the Google AI plugin.
 * If the key is missing, it will throw an error at runtime when an AI feature is used.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {isDev} from 'genkit/dev';

const plugins = [];

// The Google AI plugin is configured only when the API key is available.
// This allows the application to build and run without the key,
// but AI features will fail at runtime if the key is not provided.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    })
  );
}

export const ai = genkit({
  plugins,
  // The logger is disabled in production to avoid noisy logs.
  // In a development environment (e.g., when running `genkit dev`),
  // the logger is enabled to show detailed information.
  logLevel: isDev ? 'debug' : 'silent',
  // The flow state is persisted to the local file system in development.
  // In production, flow state is not stored.
  flowStateStore: isDev ? 'local' : 'none',
});
