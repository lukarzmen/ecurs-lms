import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { createReadStream, ReadStream } from "fs";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import OpenAIService from "@/services/OpenAIService";

export async function POST(req: Request) {

  const { url } = await req.json();

  console.log("Transcribing audio from URL:", url);
  try {
    // Step 1: Download the MP3 file from the URL
    let response;
    try {
      response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return new NextResponse("Failed to fetch audio file.", {
            status: 500,
          });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const tempFilePath = path.join(process.cwd(), "temp.mp3");

    // Save the audio buffer to a temporary file
    await fs.writeFile(tempFilePath, new Uint8Array(audioBuffer));

    // Step 2: Use OpenAI's transcriptions.create to transcribe the MP3
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {1
        throw new Error("Missing OpenAI API key");
    }
    //todo: do przeniesienia na strone serwera
    const audioStream = createReadStream(tempFilePath);
    const openAiService = new OpenAIService();

    const transcriptionResponse = await openAiService.transcribeAudio(audioStream);
    // Step 3: Clean up the temporary file
    await fs.unlink(tempFilePath);

    // Step 4: Return the transcription
    return new NextResponse(JSON.stringify({ transcription: transcriptionResponse.text }));
  } catch (error) {
    console.error("Error during transcription:", error);
    return new NextResponse("Failed to transcribe audio.", {
      status: 500,
    });
  }
}

