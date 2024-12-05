import { db } from "@/lib/db";
import { Category, Chapter, Course } from "@prisma/client";
import { getProgress } from "./get-progress";

type CourseWithProgressWithCategory = Course & {
    chapters: Chapter[];
    category: Category;
    progress: number | null;
}

type DashboardCourses = {
    completedCourses: CourseWithProgressWithCategory[];
    coursesInProgress: CourseWithProgressWithCategory[];
}

export const getDashboardCourses = async (userId: string): Promise<DashboardCourses> => {
    try {
        const purchasedCourses = await db.purchase.findMany({
            where: {
                userId: userId
            },
            select: {
                course: {
                    include: {
                        chapters: {
                            where: {
                                isPublished: true
                            }
                        },
                        category: true
                    }
                }
            }
        });

        const courses = purchasedCourses
            .map(purchasedCourse => purchasedCourse.course) as CourseWithProgressWithCategory[];

        for (let course of courses) {
            const progress = await getProgress(userId, course.id);
            course["progress"] = progress;
        }
        const completedCourses = courses.filter(course => course.progress === 100);
        const coursesInProgress = courses.filter(course => (course.progress ?? 0) !== 100);

        return {
            completedCourses,
            coursesInProgress
        };
    } catch (error) {
        console.error(error);
        return {
            completedCourses: [],
            coursesInProgress: []
        };
    }
}