import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


const CourseIdPage = async ({
    params,
    searchParams
}: {
    params: Promise<{ courseId: string; }>;
    searchParams?: Promise<{ success?: string; canceled?: string; }>;
}) => {
    const userAuth = await auth();
    const awaitedParams = await params;
    const awaitedSearchParams = searchParams ? await searchParams : {};

    if (!userAuth) {
       return redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${awaitedParams.courseId}`)}`);
    }

    // Handle payment status from Stripe redirect
    if (awaitedSearchParams.canceled === '1') {
        // Payment was canceled, ensure userCourse state is set to 0
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${awaitedParams.courseId}/payment-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'canceled' })
            });
        } catch (error) {
            console.error('Failed to update payment status:', error);
        }
        
        // Redirect to enrollment page with canceled status
        return redirect(`/courses/${awaitedParams.courseId}/enroll?canceled=1`);
    }

    if (awaitedSearchParams.success === '0') {
        // Payment failed, ensure userCourse state is set to 0
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${awaitedParams.courseId}/payment-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed' })
            });
        } catch (error) {
            console.error('Failed to update payment status:', error);
        }
        
        // Redirect to enrollment page with failed status
        return redirect(`/courses/${awaitedParams.courseId}/enroll?failed=1`);
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