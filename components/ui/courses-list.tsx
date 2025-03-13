import { Category, Course } from "@prisma/client";
import { CourseCard } from "./course-card";
import { CategoriesCourseAndModules } from "@/app/api/courses/route";

interface CoursesListProps {
    items: CategoriesCourseAndModules[];
}

export const CoursesList = ( {items} : CoursesListProps) => {

    if (items && items.length === 0) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="text-center text-sm text-muted-foreground mt-10">No courses found</div>
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
            {items.map((item) => (
                <CourseCard key={item.id} id={item.id} title={item.title} imageId={item.imageId!} chaptersLength={item.modules.length} 
                category={item.category?.name!} />
            ))}
        </div>
    );
};