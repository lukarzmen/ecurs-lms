import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { setValue } from '@/services/RedisService';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return new NextResponse("No audio file uploaded.", { status: 400 });
    }

    const id = uuidv4();

    try {
        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Store the buffer in Redis using base64 encoding
        await setValue(`audio:${id}`, fileBuffer.toString('base64'));

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in Redis:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
