import { db } from "@/lib/db";
import {redirect} from "next/navigation";

const CourseIdPage = async ({
    params
}: {
    params: {
        courseId: string;
}}) => {
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