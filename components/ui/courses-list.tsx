import { Category, Course } from "@prisma/client";
import { CourseCard } from "./course-card";
import { CourseWithWithCategory } from "@/actions/get-dashboard-courses";
import { CategoriesCourseAndModules } from "@/actions/get-courses";

interface CoursesListProps {
    items: CategoriesCourseAndModules[];
}

export const CoursesList = ( {items} : CoursesListProps) => {

    return (<div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
        {items && items.map((item) => (
            <CourseCard key={item.id} id={item.id} title={item.title} imageId={item.imageId!} chaptersLength={item.modules.length} 
           category={item.category?.name!} />
        ))}
        {items && items.length === 0 && <div className="text-center text-sm text-muted-foreground mt-10">No courses found</div>}
    </div>)
};