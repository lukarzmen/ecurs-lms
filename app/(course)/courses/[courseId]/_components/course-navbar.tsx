import { NavbarRoutes } from "@/components/navbar-routes";
import { CourseMobileSidebar, CourseSidebarProps as CourseSidebarProps } from "./course-mobile-sidebar";
import { StudentCommunicationLinks } from "./student-communication-links";


export const CourseNavbar = ({
    course
}: CourseSidebarProps) => {

    return (
        <div className="p-2 sm:p-4 border-b h-full flex items-center bg-white shadow-sm">
            <CourseMobileSidebar course={course} />
            <div className="flex items-center gap-1 sm:gap-4 ml-auto">
                <StudentCommunicationLinks courseId={course.id.toString()} />
                <NavbarRoutes />
            </div>
        </div>
    );

};


