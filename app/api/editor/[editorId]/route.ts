import { SerializedDocument } from "@lexical/file";
import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request, { params }: { params: { editorId: string } }) {
    try {
        const { editorId } = params;
        if (!editorId) {
            return new NextResponse("Bad Request: Missing editorId", {
                status: 400,
            });
        }

        const client = createClient({
            url: process.env.AZURE_REDIS_CONNECTIONSTRING
        });
        client.on('error', err => console.log('Redis Client Error', err));
        
        await client.connect();
        const editorJsonString = await client.get(editorId);
        console.log("GET /api/editor");
        console.log(editorJsonString);
        if (!editorJsonString) {
            return new NextResponse("Not Found: No data for given editorId", {
                status: 404,
            });
        }

        const response = new NextResponse(
            editorJsonString, { status: 200 }
        );
        await client.disconnect();
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
        const { editorId } = params;
        const serializedEditorDocument: SerializedDocument = await req.json();

        console.log("POST /api/editor");
        console.log(editorId);
        console.log(serializedEditorDocument);
        if (!editorId || !serializedEditorDocument) {
            return new NextResponse("Bad Request: Missing editorId or prompt", {
                status: 400,
            });
        }      

        const client = createClient({
            url: process.env.AZURE_REDIS_CONNECTIONSTRING
        });
        client.on('error', err => console.log('Redis Client Error', err));
        
        await client.connect();
        await client.set(editorId, JSON.stringify(serializedEditorDocument));


        const response = new NextResponse(
            JSON.stringify({ message: "Created" }), { status: 201 }
        );
        await client.disconnect();
        return response;
    } catch (error) {
        console.error("Error in POST /api/editor", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
    
}