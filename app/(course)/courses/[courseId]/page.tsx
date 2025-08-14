import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const CourseIdPage = async ({
    params
}: {
    params: {
        courseId: string;
    }
}) => {
    const userAuth = await auth();

    if (!userAuth) {
       return redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${params.courseId}`)}`);
    }

    const courseIdNumber = parseInt(params.courseId, 10);
    const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseIdNumber}`);
    const course = await courseResponse.json();
    if (!course) {
        return redirect('/');
    }
    return redirect(`/courses/${params.courseId}/chapters/${course.firstNotFinishedModuleId}?userId=${userAuth.userId}`);
};

export default CourseIdPage;