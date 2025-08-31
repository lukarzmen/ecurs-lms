import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ userCourseId: string }> }
) {
    try {
        const { userCourseId } = await params;
        const { state } = await req.json();

        const userCourse = await db.userCourse.update({
            where: {
                id: parseInt(userCourseId)
            },
            data: {
                state: state,
            },
        });

        return NextResponse.json(userCourse);
    } catch (error) {
        console.error("[USER_COURSE_ID_STATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}