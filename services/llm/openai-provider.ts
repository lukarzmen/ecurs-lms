import OpenAI from "openai";

// Shared caller for OpenAI-compatible chat completion APIs (OpenAI itself, DeepSeek, Kimi/Moonshot).
export async function generateWithOpenAiCompatible(opts: {
  apiKey: string;
  baseURL?: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { apiKey, baseURL, model, systemPrompt, userPrompt } = opts;
  const client = new OpenAI({ apiKey, baseURL, timeout: 110_000 });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0].message.content;
  if (content === null) {
    throw new Error("Received null content from " + (baseURL ?? "OpenAI"));
  }
  return content;
}

export async function generateWithOpenAi(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return generateWithOpenAiCompatible({ apiKey, model, systemPrompt, userPrompt });
}
