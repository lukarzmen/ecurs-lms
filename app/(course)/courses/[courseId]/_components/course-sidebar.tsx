import { db } from "@/lib/db";
import { Chapter, Course, UserProgress } from "@prisma/client";
import { redirect } from "next/navigation";
import CourseSidebarItem from "./course-sidebar-item";
import { auth } from "@clerk/nextjs/server";
;

interface CourseSidebarProps {
    course: Course & {
        chapters: (Chapter & {
            userProgress: UserProgress[] | null;
        })[]
    };
    progressCount: number | null;
}
export const CourseSidebar = async ({ course }: CourseSidebarProps) => {
    const { userId } = auth();
    if (!userId) {
        return redirect('/');
    }
    const purchases = await db.purchase.findUnique({
        where: {
            userId_courseId: {
                userId: userId,
                courseId: course.id,
            }
        },
    });
    return (
        <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm rounded-md">
            <div className="p-8 flex flex-col border-b">
                <h1 className="font-semibold">
                    {course.title}
                </h1>
                </div>
                {
                    //check purchases and add progress
                }
                <div className="flex flex-col w-full">
                    {course.chapters.map(
                        (chapter) => (
                            <CourseSidebarItem key={chapter.id} id={chapter.id} label={chapter.title} courseId={course.id} isCompleted={!!chapter.userProgress?.[0]?.isCompleted} isLocked={!chapter.isFree && !purchases} />
                        ))}
                </div>
          
        </div>
    )
};