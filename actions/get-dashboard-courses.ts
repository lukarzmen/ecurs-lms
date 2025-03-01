import { db } from "@/lib/db";
import { Category, Module, Course } from "@prisma/client";

type CourseWithWithCategory = Course & {
    modules: Module[];
    category: Category | null;
}



export const getDashboardCourses = async (userId: string): Promise<CourseWithWithCategory[]> => {
    try {
        const coursesCategories = await db.course.findMany({
            where: {
                userId
            },
            include: {
                category: true,
                modules: {
                    select: {
                        id: true,
                        moduleContentId: true,
                        position: true,
                        courseId: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return coursesCategories;
    } catch (error) {
        console.error(error);
        return [];
    }
}