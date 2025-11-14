import { ReadStream } from "fs";
import OpenAI from "openai";

export default class OpenAIService {
    async askOpenAi(prompt: LLMPrompt) : Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("Missing OpenAI API key");
            throw new Error("Missing OpenAI API key");
        }
        
        console.log("Making OpenAI request with prompt:", prompt);
        
        try {
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
                console.error("Received null content from OpenAI");
                throw new Error("Received null content from OpenAI");
            }
            
            console.log("OpenAI response content:", content);
            return content;
        } catch (error) {
            console.error("OpenAI API error:", error);
            throw error;
        }
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


  