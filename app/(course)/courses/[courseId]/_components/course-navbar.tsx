import { NavbarRoutes } from "@/components/navbar-routes";
import { Chapter, Course, UserProgress } from "@prisma/client";

interface CourseNavbarProps {
    course: Course & {
        chapters: (Chapter & {
            userProgress: UserProgress[] | null;
        })[]
    };
    progressCount: number | null;
}
export const CourseNavbar = ({
    course,
    progressCount,
}: CourseNavbarProps) => {

    return (
        <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">

        <NavbarRoutes></NavbarRoutes>
        </div>
    );

};


