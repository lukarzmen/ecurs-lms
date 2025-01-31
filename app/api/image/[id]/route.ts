import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Id not provided." }, { status: 400 });
    }

    const redisClient = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING,
    });

    redisClient.on("error", (err) => console.error("Redis Client Error:", err));

    try {
        await redisClient.connect();

        // Get base64-encoded image data from Redis
        const imageData = await redisClient.get(`image:${id}`);

        await redisClient.disconnect();

        if (!imageData) {
            return NextResponse.json({ error: "Image not found." }, { status: 404 });
        }

        // Convert base64 string back to a Buffer
        const imageBuffer = Buffer.from(imageData, "base64");

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Length": imageBuffer.byteLength.toString(),
                "Content-Disposition": `inline; filename="${id}.png"`, // Ensures direct display
            },
        });
    } catch (error) {
        console.error("Error retrieving file from Redis:", error);
        await redisClient.disconnect();
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
