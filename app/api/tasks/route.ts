import { NextResponse } from "next/server";
import { generateText } from "@/services/llm";

// AI generation can take longer than the platform default function timeout.
export const maxDuration = 120;

export async function POST(req: Request) {
    try {
        const llmPrompt: LLMPrompt = await req.json();
        console.log("Received llmPrompt", llmPrompt);
        if (!llmPrompt) {
            console.error("Missing prompt in request");
            return new NextResponse("Bad Request: Missing prompt", {
                status: 400,
            });
        }

        const modelResponse = await generateText(llmPrompt.modelId, llmPrompt.systemPrompt, llmPrompt.userPrompt);
        console.log("LLM response", modelResponse);
        const response = new NextResponse(modelResponse, {
            status: 200,
        });
        return response;
    } catch (error) {
        console.error("Error in POST /api/tasks", error);
        const errorMessage = error instanceof Error ? error.message : "Internal error";
        return new NextResponse(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

