import CourseSidebarItem from "./course-sidebar-item";
import { CourseSidebarProps } from "./course-mobile-sidebar";


export const CourseSidebar = async ({ course }: CourseSidebarProps) => {
    return (
        <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm rounded-md">
            <div className="p-8 flex flex-col border-b">
                <h1 className="font-semibold">
                    {course.title}
                </h1>
                </div>
                <div className="flex flex-col w-full">
                    {course.modules && course.modules.map(
                        (chapter) => (
                            <CourseSidebarItem key={chapter.id} id={chapter.id} label={chapter.title} courseId={course.id} progressState={chapter.progressState}/>
                        ))}
                </div>
          
        </div>
    )
};