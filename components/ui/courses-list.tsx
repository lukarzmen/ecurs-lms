import { Category, Course } from "@prisma/client";
import { CourseCard } from "./course-card";
import { CourseDetails } from "@/app/api/user/courses/route";


interface CoursesListProps {
    items: CourseDetails[];
}

export const CoursesList = ( {items} : CoursesListProps) => {

    if (items && items.length === 0) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="text-center text-sm text-muted-foreground mt-10">Nie znaleziono kursów</div>
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
            {items.map((item) => (
                <CourseCard key={item.id} author={`${item.author?.firstName} ${item.author?.lastName}`} id={item.id} moduleId={item.nonFinishedModuleId} title={item.title} imageId={item.imageId!} chaptersLength={item.modulesCount} 
                category={item.category?.name!} />
            ))}
        </div>
    );
};