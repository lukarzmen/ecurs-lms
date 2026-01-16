import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoursePaymentProcessing } from "./_components/course-payment-processing";


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

    if (!userAuth?.userId) {
        return (
            <SignedOut>
                <div className="p-6">
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl font-bold text-gray-900">Zaloguj się, aby przejść do kursu</h1>
                        <p className="text-gray-600">
                            Załóż konto lub zaloguj się, aby uzyskać dostęp do kursu i kontynuować naukę.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild>
                                <Link href={`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${awaitedParams.courseId}`)}`}>Zaloguj się</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/sign-up">Załóż konto</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </SignedOut>
        );
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

    if (awaitedSearchParams.success === '1') {
        // Stripe redirects here immediately, but access is granted asynchronously via webhook.
        // Avoid sending the user into chapter pages until permissions are active.
        return <CoursePaymentProcessing courseId={awaitedParams.courseId} userId={userAuth.userId} />;
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