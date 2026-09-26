import { ReadStream } from "fs";
import OpenAI from "openai";

export default class OpenAIService {
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


  