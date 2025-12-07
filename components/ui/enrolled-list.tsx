
import type { CourseDetails } from "@/app/api/user/courses/route";
import type { UserEducationalPathDetails } from "@/app/api/user/educational-paths/route";
import CourseInfoCard from "./course-card";

export type EnrolledItem = CourseDetails | UserEducationalPathDetails;

export type EnrolledCoursesListBaseProps = {
    items: EnrolledItem[];
};


export const EnrolledEduList = ({ items }: EnrolledCoursesListBaseProps) => {
    if (!items || items.length === 0) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="text-center text-sm text-muted-foreground mt-10">Nie znaleziono.</div>
            </div>
        );
    }
    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
            {items.map(item => {
                // Map API details to UI CourseInfoCardProps
                const displayAuthor = item.schoolId && item.schoolName 
                    ? item.schoolName 
                    : (item.author?.displayName
                    || [item.author?.firstName, item.author?.lastName].filter(Boolean).join(" ")
                    || "Nieznany autor");
                const categoryString = item.category?.name || "Brak kategorii";
                const isCompleted = 'isCompleted' in item ? item.isCompleted : false;
                return (
                    <CourseInfoCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        imageId={item.imageId ?? ""}
                        author={displayAuthor}
                        modulesCount={item.modulesCount}
                        category={categoryString}
                        type={item.type}
                        isCompleted={isCompleted}
                    />
                );
            })}
        </div>
    );
};
