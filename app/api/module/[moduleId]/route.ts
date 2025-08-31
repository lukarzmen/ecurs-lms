import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const paramsAwaited = await params;
        const chapterId = paramsAwaited.moduleId;
        const chapterIdInt = parseInt(chapterId, 10);

        const chapter = await db.module.findFirst({
            where: {
                id: chapterIdInt
            },
        });

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("[CHAPTER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}