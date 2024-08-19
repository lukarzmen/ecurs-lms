import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    {params}: {params: {courseId: string}}
){
    const {courseId} = params;
    const values = await req.json();
    console.log(values);
    try {
        const {userId} = auth() ?? "";
        if(!userId){
            return new NextResponse("Unauthorized", {
                status: 401
            });
        }
        const course = await db.course.update({
            where: {
                id: courseId,
                userId
            },
            data: {
                ...values
            }
        });
        return NextResponse.json(course);

    }catch (error) {
        console.log(error);
        return new NextResponse("Internal error", {
            status: 500
        });
    }
}