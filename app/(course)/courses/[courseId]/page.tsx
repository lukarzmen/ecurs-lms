import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


const CourseIdPage = async ({
    params
}: {
    params: Promise<{ courseId: string; }>
}) => {
    const userAuth = await auth();

    const awaitedParams = await params;

    if (!userAuth) {
       return redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${awaitedParams.courseId}`)}`);
    }

    const courseIdNumber = parseInt(awaitedParams.courseId, 10);
    const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseIdNumber}/user?userId=${userAuth.userId}`);
    const course = await courseResponse.json();
    if (!course) {
        return redirect('/');
    }
    return redirect(`/courses/${awaitedParams.courseId}/chapters/${course.firstNotFinishedModuleId}?userId=${userAuth.userId}`);
};

export default CourseIdPage;