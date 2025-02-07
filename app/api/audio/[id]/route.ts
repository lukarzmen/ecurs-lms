import { getValue } from "@/services/RedisService";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Id not provided." }, { status: 400 });
    }

    try {

        // Get base64-encoded audio data from Redis
        const audioData = await getValue(`audio:${id}`);

        if (!audioData) {
            return NextResponse.json({ error: "Audio not found." }, { status: 404 });
        }

        // Convert base64 string back to a Buffer
        const audioBuffer = Buffer.from(audioData, "base64");

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
                "Content-Disposition": `inline; filename="${id}.mp3"`, // Ensures direct playback
            },
        });
    } catch (error) {
        console.error("Error retrieving file from Redis:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
