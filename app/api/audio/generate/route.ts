import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { generateAudioFromText } from '@/services/ElevenLabsService';
import { setValue } from '@/services/RedisService';



export async function POST(req: Request) {
    const { text } = await req.json();

    if (!text) {
        return new NextResponse("No text to generate audio.", { status: 400 });
    }

    const id = uuidv4();

    try {
        const blob = await generateAudioFromText(text);

        const fileBuffer = Buffer.from(await blob.arrayBuffer());

        await setValue(`audio:${id}`, fileBuffer.toString('base64'));

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in Redis:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

