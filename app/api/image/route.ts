import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
        return new NextResponse("No image file uploaded.", { status: 400 });
    }
    
    const id = uuidv4();
    
    try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        let fileBuffer = Buffer.from(arrayBuffer);
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            fileBuffer = await sharp(fileBuffer).png().toBuffer();
        }
        
        // Store the buffer directly in the database
        await db.attachment.create({
            data: {
            guid: id,
            filename: file.name,
            fileData: fileBuffer, // Convert back to Buffer
            },
        });
        
        return new NextResponse(JSON.stringify({ message: "Created", id }), { status: 201 });
    } catch (error) {
        console.error('Error storing file in database:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}