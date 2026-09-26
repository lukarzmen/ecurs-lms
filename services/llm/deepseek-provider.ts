import { generateWithOpenAiCompatible } from "./openai-provider";

// DeepSeek exposes an OpenAI-compatible chat completions API.
export async function generateWithDeepSeek(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }
  return generateWithOpenAiCompatible({
    apiKey,
    baseURL: "https://api.deepseek.com",
    model,
    systemPrompt,
    userPrompt,
  });
}
