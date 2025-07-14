/**
 * @fileoverview This file initializes the Genkit AI instance and configures it with the necessary plugins.
 * It provides a single, centralized 'ai' object that should be used across the entire application
 * for any AI-related tasks to ensure consistency and proper initialization.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// By defining the AI instance in a separate file, we ensure that it is initialized only once
// and can be imported consistently by any server-side component or Server Action.
export const ai = genkit({
  plugins: [googleAI()],
  // For production, we don't want to store flow state. In dev, it's fine to use 'local'.
  flowStateStore: process.env.NODE_ENV === 'production' ? 'none' : 'local',
  // In production, we don't need verbose logging. In dev, it's helpful for debugging.
  logLevel: process.env.NODE_ENV === 'production' ? 'silent' : 'debug',
});
