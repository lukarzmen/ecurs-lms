import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: { userCourseId: string } }
) {
    try {

        const userCourse = await db.userCourse.update({
            where: {
                id: parseInt(params.userCourseId)
            },
            data: {
                state: 1,
            },
        });

        return NextResponse.json(userCourse);
    } catch (error) {
        console.log("[USER_COURSE_ID_STATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}