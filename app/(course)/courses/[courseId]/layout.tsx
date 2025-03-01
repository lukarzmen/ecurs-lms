import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { use } from "react";
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

    const courseId = parseInt(params.courseId, 10);
    const course = await db.course.findFirst({
        where: {
            id: courseId,
            userId,
        },
        include: {
            modules: {
                
                orderBy: {
                    position: 'asc',
                },
            },
        },
    });

    if(!course) {
        return redirect('/');
    }

    return (
        <div className="h-full">
            <div className="h-[80px] md:pl-80 fixed inset-y-0 w-full z-50">
                <CourseNavbar course={course} progressCount={100} />
            </div>
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <CourseSidebar course={course} progressCount={100} />
            </div>
            <main className="md:pl-80 pt-[80px] h-full">
                    {children}
                </main>
        </div>
    );
};

export default CourseLayout;