import { NavbarRoutes } from "@/components/navbar-routes";
import { Module, Course } from "@prisma/client";

interface CourseNavbarProps {
    course: Course & {
        modules: Module[] | null;
    };
}
export const CourseNavbar = ({
    course
}: CourseNavbarProps) => {

    return (
        <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">

        <NavbarRoutes></NavbarRoutes>
        </div>
    );

};


