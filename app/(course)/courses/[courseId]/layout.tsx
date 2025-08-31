import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";
// Import Footer (adjust the path if needed)
import Footer from "@/app/(dashboard)/_components/footer";

const CourseLayout = async ({ children, params }: {
    children: React.ReactNode;
    params: Promise<{ courseId: string; }>;
}) => {
    const resolvedParams = await params;
    const { userId } = await auth() || { userId: '' };
    if(!userId) {
        return redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${resolvedParams.courseId}`)}`);
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