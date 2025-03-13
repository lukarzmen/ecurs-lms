import { db } from "@/lib/db";
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

    // Redirect to home if user is not authenticated
    if (!userAuth) {
        return redirect("/sign-in");
    }
    // const { courseId } = params;
    // Post user permission using user data
    // const response = await fetch(`${process.env.URL}/api/permissions`, {
    //     method: 'POST',
    //     body: JSON.stringify({
    //         courseId,
    //         userId: userAuth.userId,
    //         sessionId: userAuth.sessionId,
    //     }),
    // });
    // console.log(response);
    // const result = await response.json();

    // if (!result.exists) {
    //     return (
    //         <div className="flex flex-col items-center justify-center h-full">
    //             <p className="text-lg text-gray-700">Ask teacher for permission to access this course.</p>
    //         </div>
    //     );
    // }
    const courseIdNumber = parseInt(params.courseId, 10);
    console.log("fetch course", courseIdNumber);
    const courseResponse = await fetch(`${process.env.URL}/api/courses/${courseIdNumber}`);
    const course = await courseResponse.json();
    console.log("course", course);
    if (!course) {
        return redirect('/');
    }
    console.log("redirecting to", `/courses/${params.courseId}/chapters/${course.modules[0].id}`);
    return redirect(`/courses/${params.courseId}/chapters/${course.modules[0].id}`);
};

export default CourseIdPage;