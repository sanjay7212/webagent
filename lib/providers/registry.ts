import { createProviderRegistry } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.VOCAREUM_API_KEY;
const providers: Record<string, unknown> = {};

if (apiKey) {
  // Anthropic via Vocareum gateway
  const anthropicBaseURL = process.env.ANTHROPIC_BASE_URL || "https://claude.vocareum.com/v1";
  providers.anthropic = createAnthropic({
    baseURL: anthropicBaseURL,
    apiKey,
  });

  // OpenAI via Vocareum gateway
  const openaiBaseURL = process.env.OPENAI_BASE_URL || "https://openai.vocareum.com/v1";
  providers.openai = createOpenAI({
    baseURL: openaiBaseURL,
    apiKey,
  });

  // Google Gemini via Vocareum gateway
  const googleBaseURL = process.env.GOOGLE_BASE_URL || "https://gemini.vocareum.com/v1";
  providers.google = createGoogleGenerativeAI({
    baseURL: googleBaseURL,
    apiKey,
  });
}

export const registry = createProviderRegistry(
  providers as Parameters<typeof createProviderRegistry>[0]
);
