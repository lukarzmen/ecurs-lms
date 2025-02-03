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
    // Fetch the MP3 file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Convert Buffer to Blob
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

    // Convert Blob to File (OpenAI requires File)
    const audioFile = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });

    // Use your OpenAI service
    const openAiService = new OpenAIService();
    const transcriptionResponse = await openAiService.transcribeAudio(audioFile);

    return new NextResponse(JSON.stringify({ transcription: transcriptionResponse.text }));
  } catch (error) {
    console.error("Error during transcription:", error);
    return new NextResponse("Failed to transcribe audio.", { status: 500 });
  }
}