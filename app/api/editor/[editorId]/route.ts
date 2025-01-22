import { SerializedDocument } from "@lexical/file";
import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request, { params }: { params: { editorId: string } }) {
    try {
        console.log("GET /api/editor", params);
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
        
        console.log("Create client");
        await client.connect();
        console.log("GEt redis value");
        const editorJsonString = await client.get(editorId);

  
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
        console.log("POST /api/editor", params);
        const { editorId } = params;
        const serializedEditorDocument: SerializedDocument = await req.json();

        if (!editorId || !serializedEditorDocument) {
            return new NextResponse("Bad Request: Missing editorId or prompt", {
                status: 400,
            });
        }      
        console.log("Create client");
        const client = createClient({
            url: process.env.AZURE_REDIS_CONNECTIONSTRING
        });
        client.on('error', err => console.log('Redis Client Error', err));
        console.log("Set redis value");
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