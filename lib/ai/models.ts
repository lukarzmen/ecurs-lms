// Registry of AI models the app is allowed to call. This is the single source of truth
// used by both the client (model picker) and the server (validating client-supplied model ids).
// Never let the server call a model that isn't in this list — it's the only guard against
// a client sending an arbitrary/expensive model name to the provider APIs.

export type AiProvider = "openai" | "deepseek";
export type AiCostTier = "low" | "medium" | "high";

export interface AiModelOption {
  id: string;
  provider: AiProvider;
  model: string;
  label: string;
  costTier: AiCostTier;
}

// Only two options are exposed to teachers: DeepSeek (default, cheapest) and ChatGPT
// (fallback for when DeepSeek quality/availability isn't enough).
export const AI_MODELS: AiModelOption[] = [
  { id: "deepseek:deepseek-chat", provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", costTier: "low" },
  { id: "openai:gpt-5-mini", provider: "openai", model: "gpt-5-mini", label: "ChatGPT", costTier: "low" },
];

export const DEFAULT_AI_MODEL_ID = "deepseek:deepseek-chat";

export function getAiModel(id: string | undefined | null): AiModelOption {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS.find((m) => m.id === DEFAULT_AI_MODEL_ID)!;
}

export function groupModelsByProvider(): Record<AiProvider, AiModelOption[]> {
  return AI_MODELS.reduce(
    (acc, model) => {
      acc[model.provider].push(model);
      return acc;
    },
    { openai: [], deepseek: [] } as Record<AiProvider, AiModelOption[]>,
  );
}

