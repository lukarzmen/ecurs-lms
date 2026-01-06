import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";
import { SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Import Footer (adjust the path if needed)
import Footer from "@/app/(dashboard)/_components/footer";

const CourseLayout = async ({ children, params }: {
    children: React.ReactNode;
    params: Promise<{ courseId: string; }>;
}) => {
    const resolvedParams = await params;
    const { userId } = await auth();
    if (!userId) {
        return (
            <SignedOut>
                <div className="p-6">
                    <div className="max-w-2xl space-y-4">
                        <h1 className="text-3xl font-bold text-gray-900">Zaloguj się, aby rozpocząć naukę</h1>
                        <p className="text-gray-600">
                            Ecurs to platforma kursów online — po zalogowaniu zyskasz dostęp do materiałów, postępów i funkcji kursu.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild>
                                <Link href={`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${resolvedParams.courseId}`)}`}>Zaloguj się</Link>
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
    const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${resolvedParams.courseId}/chapters?providerId=${userId}`);
    const course = await courseResponse.json();

    if(!course) {
        return redirect('/');
    }
    return (
        <div className="flex flex-col min-h-screen">
            <div className="h-[80px] md:pl-80 fixed inset-y-0 w-full z-50">
                <CourseNavbar course={course} />
            </div>
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <CourseSidebar course={course} />
            </div>
            <main className="md:pl-80 pt-[80px] flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default CourseLayout;