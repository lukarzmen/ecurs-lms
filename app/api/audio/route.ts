import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return new NextResponse("No file uploaded.", { status: 400 });
    }

    const client = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    const id = uuidv4();

    try {
        await client.connect();

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Store the buffer in Redis using base64 encoding
        await client.set(`audio:${id}`, fileBuffer.toString('base64'));

        await client.disconnect();

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in Redis:', error);
        await client.disconnect();
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
