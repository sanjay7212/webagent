export interface ModelInfo {
  id: string;
  provider: string;
  providerName: string;
  name: string;
  modelId: string;
  supportsTools: boolean;
  contextWindow: number;
}

const ALL_MODELS: ModelInfo[] = [
  {
    id: "anthropic:claude-sonnet-4-20250514",
    provider: "anthropic",
    providerName: "Anthropic",
    name: "Claude Sonnet 4",
    modelId: "claude-sonnet-4-20250514",
    supportsTools: true,
    contextWindow: 200000,
  },
  {
    id: "anthropic:claude-opus-4-20250514",
    provider: "anthropic",
    providerName: "Anthropic",
    name: "Claude Opus 4",
    modelId: "claude-opus-4-20250514",
    supportsTools: true,
    contextWindow: 200000,
  },
  {
    id: "anthropic:claude-opus-4-6",
    provider: "anthropic",
    providerName: "Anthropic",
    name: "Claude Opus 4.6",
    modelId: "claude-opus-4-6",
    supportsTools: true,
    contextWindow: 1000000,
  },
  {
    id: "openai:gpt-4o",
    provider: "openai",
    providerName: "OpenAI",
    name: "GPT-4o",
    modelId: "gpt-4o",
    supportsTools: true,
    contextWindow: 128000,
  },
  {
    id: "openai:o1",
    provider: "openai",
    providerName: "OpenAI",
    name: "o1",
    modelId: "o1",
    supportsTools: true,
    contextWindow: 200000,
  },
  {
    id: "openai:gpt-4.1",
    provider: "openai",
    providerName: "OpenAI",
    name: "GPT-4.1",
    modelId: "gpt-4.1",
    supportsTools: true,
    contextWindow: 1047576,
  },
  {
    id: "openai:gpt-5.2",
    provider: "openai",
    providerName: "OpenAI",
    name: "GPT-5.2",
    modelId: "gpt-5.2",
    supportsTools: true,
    contextWindow: 1000000,
  },
  {
    id: "google:gemini-2.0-flash",
    provider: "google",
    providerName: "Google",
    name: "Gemini 2.0 Flash",
    modelId: "gemini-2.0-flash",
    supportsTools: true,
    contextWindow: 1000000,
  },
  {
    id: "google:gemini-2.5-pro",
    provider: "google",
    providerName: "Google",
    name: "Gemini 2.5 Pro",
    modelId: "gemini-2.5-pro",
    supportsTools: true,
    contextWindow: 1000000,
  },
];

export function getAvailableModels(): ModelInfo[] {
  // Single Vocareum gateway key enables all providers
  if (process.env.VOCAREUM_API_KEY) {
    return ALL_MODELS;
  }
  // Fallback: check individual provider keys
  const available = new Set<string>();
  if (process.env.ANTHROPIC_API_KEY) available.add("anthropic");
  if (process.env.OPENAI_API_KEY) available.add("openai");
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) available.add("google");
  return ALL_MODELS.filter((m) => available.has(m.provider));
}

export function getDefaultModel(): string {
  const models = getAvailableModels();
  if (models.length === 0) {
    throw new Error("No AI provider API keys configured");
  }
  // Prefer Claude Sonnet 4, then GPT-4o, then first available
  const preferred = ["anthropic:claude-sonnet-4-20250514", "openai:gpt-4o"];
  for (const id of preferred) {
    if (models.find((m) => m.id === id)) return id;
  }
  return models[0].id;
}
