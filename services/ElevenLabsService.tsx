import { ElevenLabsClient } from "elevenlabs";

export async function generateAudioFromText(text: string): Promise<Blob> {
    console.log("Generating audio from text:", text);
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const client = new ElevenLabsClient({
        apiKey: ELEVENLABS_API_KEY,
    });

    console.log("Generating audio from text:", text);
    const audio = await client.generate({
        voice: "Alice",
        model_id: "eleven_multilingual_v2",
        text,
    });

    // Convert the Readable stream to a Blob
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
        chunks.push(chunk);
    }
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    return blob;
}
