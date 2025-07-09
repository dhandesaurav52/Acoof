
import {genkit, type Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Conditionally initialize plugins to prevent build failures when API keys are not present.
// The app is designed to handle missing keys gracefully at runtime.
const plugins: Plugin<any>[] = [];
if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
    plugins.push(googleAI());
}

export const ai = genkit({
  plugins: plugins,
});
