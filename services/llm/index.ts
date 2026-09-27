import { getAiModel } from "@/lib/ai/models";
import { generateWithOpenAi } from "./openai-provider";
import { generateWithDeepSeek } from "./deepseek-provider";

// Resolves a client-supplied model id against the whitelist in lib/ai/models.ts and
// dispatches to the matching provider. Falls back to the default model for unknown ids.
export async function generateText(modelId: string | undefined, systemPrompt: string, userPrompt: string): Promise<string> {
  const aiModel = getAiModel(modelId);

  switch (aiModel.provider) {
    case "openai":
      return generateWithOpenAi(aiModel.model, systemPrompt, userPrompt);
    case "deepseek":
      return generateWithDeepSeek(aiModel.model, systemPrompt, userPrompt);
  }
}
