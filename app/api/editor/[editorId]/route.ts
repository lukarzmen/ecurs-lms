import { getValue, setValue } from "@/services/RedisService";
import { SerializedDocument } from "@lexical/file";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { editorId: string } }) {
    try {
        console.log("GET /api/editor", params);
        const { editorId } = params;
        if (!editorId) {
            return new NextResponse("Bad Request: Missing editorId", {
                status: 400,
            });
        }

        const editorJsonString = await getValue(editorId);

        const response = new NextResponse(
            editorJsonString, { status: 200 }
        );
        return response;
    } catch (error) {
        console.error("Error in GET /api/editor", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

export async function POST(req: Request, { params }: { params: { editorId: string } }) {

    try {
        console.log("POST /api/editor", params);
        const { editorId } = params;
        const serializedEditorDocument: SerializedDocument = await req.json();

        if (!editorId || !serializedEditorDocument) {
            return new NextResponse("Bad Request: Missing editorId or prompt", {
                status: 400,
            });
        }      

        await setValue(editorId, JSON.stringify(serializedEditorDocument));

        const response = new NextResponse(
            JSON.stringify({ message: "Created" }), { status: 201 }
        );
        return response;
    } catch (error) {
        console.error("Error in POST /api/editor", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
    
}