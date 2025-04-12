import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { generateAudioFromText } from '@/services/ElevenLabsService';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    const { text } = await req.json();

    if (!text) {
        return new NextResponse("No text to generate audio.", { status: 400 });
    }

    const id = uuidv4();

    try {
        const blob = await generateAudioFromText(text);
        const fileBuffer = Buffer.from(await blob.arrayBuffer());

        // Store the buffer in the database
        const filename = `${text.substring(0, 10)}-${new Date().toISOString()}.mp3`;
        await db.attachment.create({
            data: {
            guid: id,
            filename: filename, // Or determine the actual filename/extension
            fileData: fileBuffer,
            },
        });

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in database:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

