type LLMPrompt = {
  userPrompt: string;
  systemPrompt: string;
  // One of the ids in lib/ai/models.ts; server falls back to the default model if omitted/unknown.
  modelId?: string;
};
