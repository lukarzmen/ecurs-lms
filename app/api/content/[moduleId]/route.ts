import { SerializedDocument } from "@lexical/file";
import { NextResponse } from "next/server";
import { db } from '@/lib/db';

// Extend global type for chunk storage
declare global {
    var uploadChunks: Map<string, string[]> | undefined;
}

export async function GET(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
    try {
        const { moduleId } = await params;

        if (!moduleId) {
            return new NextResponse("Bad Request: Missing moduleId", {
                status: 400,
            });
        }

        const moduleIdInt = parseInt(moduleId, 10);
        if (isNaN(moduleIdInt)) {
            return new NextResponse("Bad Request: Invalid moduleId", {
                status: 400,
            });
        }

        // Fetch ModuleContent from the database by moduleId
        const moduleContent = await db.moduleContent.findUnique({
            where: {
                moduleId: moduleIdInt,
            },
        });

        if (!moduleContent) {
            return new NextResponse("Module content not exists", {
            status: 404,
            });
        }

        return NextResponse.json(moduleContent.data, { status: 200 });

    } catch (error) {
        console.error("Error retrieving file from database:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
    try {
        const { moduleId } = await params;

        if (!moduleId) {
            return new NextResponse("Bad Request: Missing moduleId", {
                status: 400,
            });
        }
        
        const moduleIdInt = parseInt(moduleId, 10);
        if (isNaN(moduleIdInt)) {
            return new NextResponse("Bad Request: Invalid moduleId", {
                status: 400,
            });
        }

        // Check if this is a chunked upload
        const contentType = req.headers.get('content-type');
        
        if (contentType?.includes('application/x-chunk')) {
            // Handle chunked upload
            return handleChunkedUpload(req, moduleIdInt);
        } else {
            // Handle regular upload
            const serializedEditorDocument: SerializedDocument = await req.json();
            
            if (!serializedEditorDocument) {
                return new NextResponse("Bad Request: Missing document", {
                    status: 400,
                });
            }

            const serializedEditorDocumentString = JSON.stringify(serializedEditorDocument);
            await db.moduleContent.upsert({
                where: {
                    moduleId: moduleIdInt,
                },
                update: {
                    data: serializedEditorDocumentString,
                },
                create: {
                    moduleId: moduleIdInt,
                    data: serializedEditorDocumentString,
                },
            });
            
            return new NextResponse(
                JSON.stringify({ message: "Created" }), { status: 201 }
            );
        }
    } catch (error) {
        console.error("Error in POST /api/content", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

// Handle chunked upload with streaming response
async function handleChunkedUpload(req: Request, moduleId: number) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const chunkHeader = req.headers.get('x-chunk-info');
                if (!chunkHeader) {
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ error: 'Missing chunk info' })}\n\n`
                    ));
                    controller.close();
                    return;
                }

                const { chunkIndex, totalChunks, sessionId } = JSON.parse(chunkHeader);
                
                // Send progress update
                controller.enqueue(new TextEncoder().encode(
                    `data: ${JSON.stringify({ 
                        status: 'receiving', 
                        progress: Math.round((chunkIndex / totalChunks) * 50) // 50% for receiving
                    })}\n\n`
                ));

                const chunkData = await req.text();
                
                // Store chunk in temporary storage (you might want to use Redis or file system)
                const tempKey = `upload_${sessionId}_${moduleId}`;
                
                // For now, we'll use a simple in-memory approach
                // In production, use Redis or database for chunk storage
                if (!global.uploadChunks) {
                    global.uploadChunks = new Map();
                }
                
                if (!global.uploadChunks.has(tempKey)) {
                    global.uploadChunks.set(tempKey, []);
                }
                
                const chunks = global.uploadChunks.get(tempKey);
                if (!chunks) {
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ error: 'Failed to initialize chunks' })}\n\n`
                    ));
                    controller.close();
                    return;
                }
                
                chunks[chunkIndex] = chunkData;
                
                if (chunks.filter(Boolean).length === totalChunks) {
                    // All chunks received, reconstruct the document
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ status: 'reconstructing', progress: 75 })}\n\n`
                    ));
                    
                    const fullData = chunks.join('');
                    const serializedDocument = JSON.parse(fullData);
                    
                    // Save to database
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ status: 'saving', progress: 90 })}\n\n`
                    ));
                    
                    await db.moduleContent.upsert({
                        where: { moduleId },
                        update: { data: JSON.stringify(serializedDocument) },
                        create: { moduleId, data: JSON.stringify(serializedDocument) },
                    });
                    
                    // Cleanup
                    global.uploadChunks.delete(tempKey);
                    
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ status: 'complete', progress: 100 })}\n\n`
                    ));
                } else {
                    // More chunks needed
                    controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({ 
                            status: 'waiting', 
                            progress: Math.round(((chunks.filter(Boolean).length) / totalChunks) * 50),
                            received: chunks.filter(Boolean).length,
                            total: totalChunks
                        })}\n\n`
                    ));
                }
                
                controller.close();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                controller.enqueue(new TextEncoder().encode(
                    `data: ${JSON.stringify({ error: errorMessage })}\n\n`
                ));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}