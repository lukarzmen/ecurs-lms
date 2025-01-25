import OpenAIService from "@/services/OpenAIService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const llmPrompt: LLMPrompt = await req.json();
        console.log("llmPrompt", llmPrompt);
        if (!llmPrompt) {
            return new NextResponse("Bad Request: Missing prompt", {
                status: 400,
            });
        }

        const openAIService = new OpenAIService();
        const modelResponse = await openAIService.askOpenAi(llmPrompt);
        const response = new NextResponse(modelResponse, {
            status: 200,
        });
        return response;
    } catch (error) {
        console.error("Error in POST /api/tasks", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

