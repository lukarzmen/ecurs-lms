import OpenAI from "openai";

export default class OpenAIService {
    async askOpenAi(prompt: LLMPrompt) : Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {1
            throw new Error("Missing OpenAI API key");
        }
        //todo: do przeniesienia na strone serwera
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompt.systemPrompt },
                {
                    role: "user",
                    content: prompt.userPrompt,
                },
            ],
        });
        const content = completion.choices[0].message.content;
        if (content === null) {
            throw new Error("Received null content from OpenAI");
        }
        return content;
    }
}