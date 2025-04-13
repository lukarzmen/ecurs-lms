import { NextApiRequest, NextApiResponse } from 'next';
import { db } from "@/lib/db";
import { Category, Module, Course } from "@prisma/client";
import { NextResponse } from 'next/server';

export type CourseWithCategory = Course & {
    modules: { id: number }[];
    category: Category | null;
    author: {
        firstName: string | null;
        lastName: string | null;
    } | null;
}


const getDashboardCourses = async (userId: string): Promise<CourseWithCategory[]> => {
    try {
        const user = await db.user.findUnique({
            where: {
            providerId: userId,
            },
        });

        if (!user) {
            return [];
        }

        const coursesCategories = await db.course.findMany({
            where: {
            userCourses: {
                some: {
                userId: user.id,
                },
            },
            },
            include: {
            category: true,
            modules: {
                select: {
                id: true
                },
            },
            author: {
                select: {
                    firstName: true,
                    lastName: true,
                }
            }
            },
            orderBy: {
            createdAt: "desc",
            },
        });

        return coursesCategories;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function GET(req: Request): Promise<NextResponse<CourseDetails[] | { error: string }>> {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') as string;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const courses = await getDashboardCourses(userId);
    const coursesWithNonFinishedModules: CourseDetails[] = courses.map((course: CourseWithCategory) => {
        const modules = course.modules;
        const lastModuleId = modules.length > 0 ? Math.max(...modules.map(module => module.id)) : 0;
        const author = course.author;
        return {
            ...course,
            author: author,
            modulesCount: modules.length,
            nonFinishedModuleId: lastModuleId,
        };
    });

    return NextResponse.json(coursesWithNonFinishedModules, { status: 200 });
}

export type CourseDetails = Course & {
    category: Category | null
    nonFinishedModuleId: number
    modulesCount: number
    author: {
        firstName: string | null;
        lastName: string | null;
    } | null;
  };