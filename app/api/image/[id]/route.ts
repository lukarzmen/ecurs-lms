import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    const { id } = await params;

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
            return NextResponse.json({ error: "Image not found." }, { status: 404 });
        }

        return new Response(new Uint8Array(attachment.fileData), {
            status: 200,
            headers: {
            "Content-Type": "image/png",
            "Content-Length": attachment.fileData.length.toString(),
            "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
            },
        });
    } catch (error) {
        console.error("Error retrieving file from database:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}