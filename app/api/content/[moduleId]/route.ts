import { SerializedDocument } from "@lexical/file";
import { NextResponse } from "next/server";
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { moduleId: string } }) {
    try {
        console.log("GET /api/content", params);
        const { moduleId } = params;

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
            return new NextResponse("ModuleContent not found", {
            status: 404,
            });
        }

        return NextResponse.json(moduleContent.data, { status: 200 });

    } catch (error) {
        console.error("Error retrieving file from database:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { moduleId: string } }) {
    try {
        console.log("POST /api/content", params);
        const { moduleId } = params;
        const serializedEditorDocument: SerializedDocument = await req.json();

        if (!moduleId || !serializedEditorDocument) {
            return new NextResponse("Bad Request: Missing moduleId or prompt", {
                status: 400,
            });
        }
        const moduleIdInt = parseInt(moduleId, 10);
        if (isNaN(moduleIdInt)) {
            return new NextResponse("Bad Request: Invalid moduleId", {
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
        const response = new NextResponse(
            JSON.stringify({ message: "Created" }), { status: 201 }
        );
        return response;
    } catch (error) {
        console.error("Error in POST /api/content", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}