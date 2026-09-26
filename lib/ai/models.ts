// Registry of AI models the app is allowed to call. This is the single source of truth
// used by both the client (model picker) and the server (validating client-supplied model ids).
// Never let the server call a model that isn't in this list — it's the only guard against
// a client sending an arbitrary/expensive model name to the provider APIs.

export type AiProvider = "openai" | "deepseek" | "kimi";
export type AiCostTier = "low" | "medium" | "high";

export interface AiModelOption {
  id: string;
  provider: AiProvider;
  model: string;
  label: string;
  costTier: AiCostTier;
}

export const AI_MODELS: AiModelOption[] = [
  { id: "openai:gpt-5-mini", provider: "openai", model: "gpt-5-mini", label: "OpenAI GPT-5 mini", costTier: "low" },
  { id: "openai:gpt-4o-mini", provider: "openai", model: "gpt-4o-mini", label: "OpenAI GPT-4o mini", costTier: "low" },
  { id: "openai:gpt-4o", provider: "openai", model: "gpt-4o", label: "OpenAI GPT-4o", costTier: "high" },
  { id: "deepseek:deepseek-chat", provider: "deepseek", model: "deepseek-chat", label: "DeepSeek Chat", costTier: "low" },
  { id: "deepseek:deepseek-reasoner", provider: "deepseek", model: "deepseek-reasoner", label: "DeepSeek Reasoner", costTier: "medium" },
  { id: "kimi:kimi-k2-0711-preview", provider: "kimi", model: "kimi-k2-0711-preview", label: "Kimi K2", costTier: "low" },
];

export const DEFAULT_AI_MODEL_ID = "openai:gpt-5-mini";

export function getAiModel(id: string | undefined | null): AiModelOption {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS.find((m) => m.id === DEFAULT_AI_MODEL_ID)!;
}

export function groupModelsByProvider(): Record<AiProvider, AiModelOption[]> {
  return AI_MODELS.reduce(
    (acc, model) => {
      acc[model.provider].push(model);
      return acc;
    },
    { openai: [], deepseek: [], kimi: [] } as Record<AiProvider, AiModelOption[]>,
  );
}

