import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { generateAudioFromText } from '@/services/ElevenLabsService';



export async function POST(req: Request) {
    const { text } = await req.json();

    if (!text) {
        return new NextResponse("No text to generate audio.", { status: 400 });
    }

    const redisClient = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    const id = uuidv4();

    try {
        const blob = await generateAudioFromText(text);

        await redisClient.connect();

        // Convert file to buffer
        const fileBuffer = Buffer.from(await blob.arrayBuffer());

        // Store the buffer in Redis using base64 encoding
        await redisClient.set(`audio:${id}`, fileBuffer.toString('base64'));

        await redisClient.disconnect();

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in Redis:', error);
        await redisClient.disconnect();
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

