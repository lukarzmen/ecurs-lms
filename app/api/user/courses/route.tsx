import { NextApiRequest, NextApiResponse } from 'next';
import { db } from "@/lib/db";
import { Category, Module, Course } from "@prisma/client";
import { NextResponse } from 'next/server';

export type CourseWithWithCategory = Course & {
    modules: Module[];
    category: Category | null;
}


export const getDashboardCourses = async (userId: string): Promise<CourseWithWithCategory[]> => {
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
                id: true,
                moduleContentId: true,
                title: true,
                position: true,
                courseId: true,
                createdAt: true,
                updatedAt: true,
                },
            },
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

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') as string;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const courses = await getDashboardCourses(userId);
    return NextResponse.json(courses, { status: 200 });
}
