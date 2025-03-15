import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { moduleId: string } }
) {
    try {
        const chapterId = params.moduleId;
        const chapterIdInt = parseInt(chapterId, 10);

        const chapter = await db.module.findFirst({
            where: {
                id: chapterIdInt
            },
        });

        return NextResponse.json(chapter);
    } catch (error) {
        console.log("[CHAPTER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}