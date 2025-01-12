import OpenAIService from "@/services/OpenAIService";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//todo: do przejscia na POST i prompt w body
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const prompt = url.searchParams.get("prompt");

        if (!prompt) {
            return new NextResponse("Bad Request: Missing prompt", {
                status: 400,
            });
        }

        const openAIService = new OpenAIService();
        const modelResponse = await openAIService.askOpenAi(prompt);
        const response = new NextResponse(modelResponse, {
            status: 200,
        });
        return response;
    } catch (error) {
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

