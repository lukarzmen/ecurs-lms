import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Category, Course } from "@prisma/client";

export type CourseWithCategory = Course & {
  modules: { id: number }[];
  category: Category | null;
  author: {
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null; // Add displayName as optional
  } | null;
}

type CourseSearchResponse = CourseWithCategory & {
  modulesCount: number;
  nonFinishedModuleId: number;
  enrolled: boolean;
};

export async function GET(req: NextRequest): Promise<NextResponse<CourseSearchResponse[] | { error: string }>> {
  const nextUrl = await req.nextUrl;
  const { searchParams } = nextUrl;
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
        state: 1, // Only published courses
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
            lastName: true,
            displayName: true, // Select displayName
          }
        },
        price: {
          select: {
            amount: true,
            currency: true,
            isRecurring: true,
            interval: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const response: CourseSearchResponse[] = courses.map((course: any) => {
      const modules = course.modules;
      const lastModuleId = modules.length > 0 ? Math.max(...modules.map((module: any) => module.id)) : 0;
      const enrolled = enrolledCourseIds.includes(course.id);

      // Prefer displayName if exists, else fallback to first+last name
      const authorDisplay =
        course.author?.displayName?.trim()
          ? course.author.displayName
          : `${course.author?.firstName ?? ""} ${course.author?.lastName ?? ""}`.trim();

      return {
        ...course,
        modulesCount: modules.length,
        nonFinishedModuleId: lastModuleId,
        enrolled,
        price: course.price?.amount ?? null,
        currency: course.price?.currency ?? null,
        isRecurring: course.price?.isRecurring ?? false,
        interval: course.price?.interval ?? null,
        author: course.author
          ? {
              ...course.author,
              displayName: authorDisplay,
            }
          : null,
      };
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET_COURSES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}