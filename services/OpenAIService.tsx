import OpenAI from "openai";

export default class OpenAIService {
    openai: OpenAI;
    constructor() {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OpenAI API key");
        }
        //todo: do przeniesienia na strone serwera
        this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    }

    async askOpenAi(prompt: string) : Promise<string> {
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Tworzysz materiały na rzecz szkoły języka rosyjskiego. Generuj tekst na podstawie poleceń." },
                {
                    role: "user",
                    content: prompt,
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