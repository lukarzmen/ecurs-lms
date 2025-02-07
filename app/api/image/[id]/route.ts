import { getValue } from "@/services/RedisService";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Id not provided." }, { status: 400 });
    }

    try {
        // Get base64-encoded image data from Redis
        const imageData = await getValue(`image:${id}`);

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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
