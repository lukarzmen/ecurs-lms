import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Import your Prisma client

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

        // Store the buffer in the database
        await db.attachment.create({
            data: {
                guid: id,
                filename: file.name,
                fileData: fileBuffer,
            },
        });

        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in database:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
