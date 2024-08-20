import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, {params}: {params: {courseId: string}}){
    const {courseId} = params;
    const {imageUrl} = await req.json();
    try {
        const {title} = await req.json();
        const {userId} = auth() ?? "";
        if(!userId){
            return new NextResponse("Unauthorized", {
                status: 401
            });
        }
        const courseOwner = await db.course.findUnique({
            where: {
                id: courseId,
                userId: userId
            }
        });
        if(!courseOwner){
            return new NextResponse("Unauthorized", {
                status: 401
            });
        }

        const lastChapters = await db.chapter.findFirst({
            where: {
                courseId: courseId,
                isPublished: true,
               
            },
            orderBy: {
                position: "desc"
            }
        });

        const newPosition = lastChapters ? lastChapters.position + 1 : 1;
        
        const chapter = await db.chapter.create({
            data: {
                courseId: courseId,
                position: newPosition,
                title: title
            }
        });
        return NextResponse.json(chapter);
    }
    catch (error) {
        console.log(error);
        return new NextResponse("Internal error", {
            status: 500
        });
    }
}