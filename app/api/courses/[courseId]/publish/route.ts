import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    {params}: {params: {courseId: string}}
){
    const {courseId} = params;

    try {
        const {userId} = auth() ?? "";
        if(!userId){
            return new NextResponse("Unauthorized", {
                status: 401
            });
        }
        const ownCourse = await db.course.findFirst({
            where: {
                id: courseId,
                userId
            }
        });
        if(!ownCourse){
            return new NextResponse("Unauthorized", {
                status: 401
            });
        }
        const coursesUpdated = await db.course.update({
            where: {
                id: params.courseId,
                userId: userId
            },
            data: {
                isPublished: true
            }
        });
        return NextResponse.json(coursesUpdated);

    }catch (error) {
        console.log(error);
        return new NextResponse("Internal error", {
            status: 500
        });
    }
}