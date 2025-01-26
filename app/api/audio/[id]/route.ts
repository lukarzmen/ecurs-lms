import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { error: "Id not provided." },
            { status: 400 }
        );
    }

    const redisClient = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING,
    });

    try {
        redisClient.on("error", (err) =>
            console.error("Redis Client Error:", err)
        );

        await redisClient.connect();

        const audioData = await redisClient.get(`audio:${id}`);
        const audioBuffer = audioData ? Buffer.from(audioData, 'binary') : null; // Convert the data to a buffer
        await redisClient.disconnect();

        if (!audioBuffer) {
            return NextResponse.json(
                { error: "Audio not found." },
                { status: 404 }
            );
        }

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
                "Content-Disposition": `attachment; filename="${id}.mp3"`, // Marks the file as downloadable
            },
        });
    } catch (error) {
        console.error("Error connecting to Redis:", error);
        try {
            await redisClient.disconnect();
        } catch (disconnectError) {
            console.error("Error disconnecting Redis:", disconnectError);
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
