import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return new NextResponse("No  imagefile uploaded.", { status: 400 });
    }

    const client = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    const id = uuidv4();

    try {
        await client.connect();

        // Convert file to buffer
        let fileBuffer = Buffer.from(await file.arrayBuffer());
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            fileBuffer = await sharp(fileBuffer).png().toBuffer();
        }

        // Store the buffer in Redis using base64 encoding
        await client.set(`image:${id}`, fileBuffer.toString('base64'));

        await client.disconnect();

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in Redis:', error);
        await client.disconnect();
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
