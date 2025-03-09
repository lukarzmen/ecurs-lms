import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {redirect} from "next/navigation";

const CourseIdPage = async ({
    params
}: {
    params: {
        courseId: string;
}}) => {
    const userAuth = await auth();
    
        // Redirect to home if user is not authenticated
        if (!userAuth) {
            return redirect("/sign-in");
        }
    const user = userAuth.userId;
    const { courseId } = params;
    // Post user permission using user data
    const response = await fetch(`${process.env.URL}/api/permissions`, {
        method: 'POST',
        body: JSON.stringify({
            courseId,
            userId: userAuth.userId,
            sessionId : userAuth.sessionId,
        }),
    });
    const courseIdNumber = parseInt(params.courseId, 10);
    console.log(courseIdNumber);
    const course = await db.course.findUnique({
        where: {
            id: courseIdNumber
        },
        include: {
            modules: {
                orderBy: {
                    position: 'asc'
                },
            }
        }
    });

    if(!course) {
        return redirect('/');
    }
    return redirect(`/courses/${params.courseId}/chapters/${course.modules[0].id}`);
    };

export default CourseIdPage;