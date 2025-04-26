import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";

const CourseLayout = async ({ children, params }: {
    children: React.ReactNode;
    params: { courseId: string; };
}) => {
    const { userId } = auth() || { userId: '' };
    if(!userId) {
        return redirect("/sign-in");
      }

    const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${params.courseId}/chapters?providerId=${userId}`);
    const course = await courseResponse.json();

    if(!course) {
        return redirect('/');
    }
    return (
        <div className="h-full">
            <div className="h-[80px] md:pl-80 fixed inset-y-0 w-full z-50">
                <CourseNavbar course={course} />
            </div>
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <CourseSidebar course={course} />
            </div>
            <main className="md:pl-80 pt-[80px] h-full">
                    {children}
                </main>
        </div>
    );
};

export default CourseLayout;