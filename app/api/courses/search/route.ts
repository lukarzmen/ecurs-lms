import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Category, Course } from "@prisma/client";

export type CourseWithCategory = Course & {
  modules: { id: number }[];
  category: Category | null;
  author: {
      firstName: string | null;
      lastName: string | null;
  } | null;
}

type CourseSearchResponse = CourseWithCategory & {
  modulesCount: number;
  nonFinishedModuleId: number;
  enrolled: boolean;
};

export async function GET(req: NextRequest): Promise<NextResponse<CourseSearchResponse[] | { error: string }>> {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || undefined;
  const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
  const userId = searchParams.get('userId') || undefined;
  let enrolledCourseIds: number[] = [];

  try {
    if (userId) {
      const user = await db.user.findUnique({
        where: { providerId: userId },
        select: { id: true }
      });
      if (user) {
        const userCourses = await db.userCourse.findMany({
          where: { userId: user.id },
          select: { courseId: true }
        });
        enrolledCourseIds = userCourses.map(uc => uc.courseId);
      }
    }

    const courses = await db.course.findMany({
      where: {
        title: {
          contains: title,
          mode: "insensitive",
        },
        categoryId: categoryId,
        mode: 1, // Only public courses
      },
      include: {
        category: true,
        modules: {
          select: {
            id: true
          }
        },
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const response: CourseSearchResponse[] = courses.map((course: CourseWithCategory) => {
      const modules = course.modules;
      const lastModuleId = modules.length > 0 ? Math.max(...modules.map(module => module.id)) : 0;
      const enrolled = enrolledCourseIds.includes(course.id);

      return {
        ...course,
        modulesCount: modules.length,
        nonFinishedModuleId: lastModuleId,
        enrolled,
      };
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET_COURSES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}