import { NextResponse } from "next/server";
import { db } from '@/lib/db'; // Import your Prisma client

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Id not provided." }, { status: 400 });
    }

    try {
        // Get attachment from the database by guid
        const attachment = await db.attachment.findUnique({
            where: {
                guid: id,
            },
        });

        if (!attachment) {
            return NextResponse.json({ error: "Audio not found." }, { status: 404 });
        }

        // Extract the audio buffer from the attachment
        const audioBuffer = attachment.fileData;

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
            "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`, // Encode filename
            },
        });
    } catch (error) {
        console.error("Error retrieving file from database:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
