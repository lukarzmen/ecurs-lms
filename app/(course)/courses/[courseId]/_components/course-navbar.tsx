import { NavbarRoutes } from "@/components/navbar-routes";
import { CourseMobileSidebar, CourseSidebarProps as CourseSidebarProps } from "./course-mobile-sidebar";


export const CourseNavbar = ({
    course
}: CourseSidebarProps) => {

    return (
        <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
        <CourseMobileSidebar course={course} />
        <NavbarRoutes></NavbarRoutes>
        </div>
    );

};


