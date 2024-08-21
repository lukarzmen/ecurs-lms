import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function PATCH(req: Request,
{params}: {params: {courseId: string; chapterId: string;};}
){
    try {
        const {userId} = auth() ?? "";
        if (!userId) {
            return new NextResponse("Unauthorized", {status: 401});
        }
        const ownCourse = await db.course.findFirst({
            where: {
                id: params.courseId,
                userId
            }
        });
        if (!ownCourse) {
            return new NextResponse("Unauthorized", {status: 401});
        }
        const {isPublished, ...values} = await req.json();
        const chapter = await db.chapter.update({
            where: {
                id: params.chapterId
            },
            data: {
                ...values
            }
        });
        return NextResponse.json(chapter);
    }
    catch (error) {
        console.log("[COURSES_CHAPTER_ID]", error);
        return new Response("Internal server error", {status: 500});
    }

}