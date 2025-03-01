import { Category, Course } from "@prisma/client";
import { db } from "@/lib/db";

type CourseWithCategory = Course & {
    category: Category | null
    chapters: { id: number }[]
};

type GetCourses = {
    userId: string;
    title?: string;
    categoryId?: number;
}

export const getCourses = async ({ userId, categoryId, title }: GetCourses): Promise<CourseWithCategory[]> => {
    {
        try {
            const courses = await db.course.findMany({
                where: {
                    title: {
                        contains: title,
                    },
                    categoryId: categoryId
                },
                include: {
                    category: true,
                    modules: {
                        select: {
                            id: true
                        }
                    },                  
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
           
            return courses.map(course => ({
                ...course,
                chapters: course.modules
            }));
        } catch (error) {
            console.error("[GET_COURSES]", error);
            return [];

        }
    }
}