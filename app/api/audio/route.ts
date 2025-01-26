import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
   const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
        return new NextResponse("No file uploaded.", {
            status: 400,
        });
    }
    console.log("Create client");
    const client = createClient({
        url: process.env.AZURE_REDIS_CONNECTIONSTRING
    });
    client.on('error', (err) => console.error('Redis Client Error', err));
    client.on('error', err => console.log('Redis Client Error', err));
    console.log("Set redis value");
    const id = uuidv4();
    try {
        await client.connect();
        const fileBuffer = await file.arrayBuffer();
        await client.set(`audio:${id}`, Buffer.from(fileBuffer));
        return new NextResponse(
            JSON.stringify({ message: "Created", id: id }), { status: 201 }
        );
    } catch (error) {
        console.error('Error connecting to Redis', error);
        await client.disconnect();
        return new NextResponse("Internal Server Error", {
            status: 500,
        });
    } 
}

