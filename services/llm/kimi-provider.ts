import { generateWithOpenAiCompatible } from "./openai-provider";

// Kimi (Moonshot AI) exposes an OpenAI-compatible chat completions API.
export async function generateWithKimi(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing KIMI_API_KEY");
  }
  return generateWithOpenAiCompatible({
    apiKey,
    baseURL: "https://api.moonshot.cn/v1",
    model,
    systemPrompt,
    userPrompt,
  });
}
