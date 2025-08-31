import { CourseInfoCard } from "./course-card";
import { MarketplaceCoursesListBaseProps } from "./marketplace-list";
import type { CourseInfoCardProps } from "./course-card";



// Accepts CourseDetails[] from API, maps to CourseInfoCardProps for UI
import type { CourseDetails } from "@/app/api/user/courses/route";

export type EnrolledCoursesListBaseProps = {
    items: CourseDetails[];
};


export const EnrolledCoursesList = ({ items }: EnrolledCoursesListBaseProps) => {
    if (!items || items.length === 0) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="text-center text-sm text-muted-foreground mt-10">Nie znaleziono kursów</div>
            </div>
        );
    }
    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
            {items.map(item => {
                // Map API CourseDetails to UI CourseInfoCardProps
                const authorString = item.author?.displayName
                    || [item.author?.firstName, item.author?.lastName].filter(Boolean).join(" ")
                    || "Nieznany autor";
                const categoryString = item.category?.name || "Brak kategorii";
                return (
                    <CourseInfoCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        imageId={item.imageId ?? ""}
                        author={authorString}
                        chaptersLength={item.modulesCount}
                        category={categoryString}
                        nonFinishedModuleId={item.nonFinishedModuleId}
                        enrolled={item.enrolled}
                        isCompleted={item.isCompleted}
                    />
                );
            })}
        </div>
    );
};
