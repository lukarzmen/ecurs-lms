import { ReadStream } from "fs";
import OpenAI from "openai";

export default class OpenAIService {
    async askOpenAi(prompt: LLMPrompt) : Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OpenAI API key");
        }
        //todo: do przeniesienia na strone serwera
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
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
    async transcribeAudio(audioFile: File) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OpenAI API key");
        }
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true  });
        const transcriptionResponse = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
        });
        console.log("transcription: ", transcriptionResponse.text);
        return transcriptionResponse;
      }
}


  