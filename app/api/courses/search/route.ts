import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Category, Course } from "@prisma/client";

export type LearningUnit = Course & {
  category: Category | null;
  school: { name: string } | null;
  author: {
      id?: number;
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null;
  } | null;
}

type LearningUnitSearchResponse = LearningUnit & {
  enrolled: boolean;
  type: "educationalPath" | "course" | null;
};

export async function GET(req: NextRequest): Promise<NextResponse<LearningUnitSearchResponse[] | { error: string }>> {
  const nextUrl = await req.nextUrl;
  const { searchParams } = nextUrl;
  const title = searchParams.get('title') || undefined;
  const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
  const userId = searchParams.get('userId') || undefined;
  let enrolledCourseIds: number[] = [];
  let user: { id: number } | null = null;

  try {
    if (userId) {
      user = await db.user.findUnique({
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

    // Fetch courses
    const courses = await db.course.findMany({
      where: {
        title: {
          contains: title,
          mode: "insensitive",
        },
        categoryId: categoryId,
        mode: 1,
        state: 1,
      },
      include: {
        category: true,
        school: { select: { id: true, name: true } },
        author: { select: { id: true, displayName: true } },
        price: { select: { amount: true, currency: true, isRecurring: true, interval: true, trialPeriodDays: true, trialPeriodEnd: true, trialPeriodType: true, vatRate: true } }
      },
    });

    // Fetch educational paths
    const educationalPaths = await db.educationalPath.findMany({
      where: {
        title: {
          contains: title,
          mode: "insensitive",
        },
        categoryId: categoryId,
        state: 1,
        mode: 1,
      },
      include: {
        school: { select: { id: true, name: true } },
        author: { select: { id: true, displayName: true } },
        category: true,
        price: { select: { amount: true, currency: true, isRecurring: true, interval: true, trialPeriodDays: true, trialPeriodEnd: true, trialPeriodType: true, vatRate: true } }
      },
    });
    
    console.log("[API_SEARCH] Paths count:", educationalPaths.length);
    console.log("[API_SEARCH] Sample path:", educationalPaths[0] ? { id: educationalPaths[0].id, categoryId: educationalPaths[0].categoryId, category: educationalPaths[0].category } : "none");

    // Map courses
    const mappedCourses = courses.map((course: any) => {
      const enrolled = enrolledCourseIds.includes(course.id);
      return {
        ...course,
        enrolled,
        price: course.price?.amount ?? null,
        currency: course.price?.currency ?? null,
        isRecurring: course.price?.isRecurring ?? false,
        interval: course.price?.interval ?? null,
        trialPeriodDays: course.price?.trialPeriodDays ?? null,
        trialPeriodEnd: course.price?.trialPeriodEnd ?? null,
        trialPeriodType: course.price?.trialPeriodType ?? null,
        vatRate: course.price?.vatRate ?? 23,
        type: "course",
        schoolId: course.schoolId ?? null,
        schoolName: course.school?.name ?? null,
        updatedAt: course.updatedAt,
      };
    });

    // Get all enrolled educationalPath IDs for user
    let enrolledEduPathIds: number[] = [];
    if (user) {
      const userEduPaths = await db.userEducationalPath.findMany({
        where: { userId: user.id, state: 1 },
        select: { educationalPathId: true }
      });
      enrolledEduPathIds = userEduPaths.map(up => up.educationalPathId);
    }

    const mappedPaths = educationalPaths.map((path: any) => {
      const enrolled = enrolledEduPathIds.includes(path.id);
      return {
        ...path,
        enrolled,
        price: path.price?.amount ?? null,
        currency: path.price?.currency ?? null,
        isRecurring: path.price?.isRecurring ?? false,
        interval: path.price?.interval ?? null,
        trialPeriodDays: path.price?.trialPeriodDays ?? null,
        trialPeriodEnd: path.price?.trialPeriodEnd ?? null,
        trialPeriodType: path.price?.trialPeriodType ?? null,
        vatRate: path.price?.vatRate ?? 23,
        type: "educationalPath",
        schoolId: path.schoolId ?? null,
        schoolName: path.school?.name ?? null,
        updatedAt: path.updatedAt,
      };
    });

    // Union and sort by updatedAt desc
    const union = [...mappedCourses, ...mappedPaths].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json(union);

  } catch (error) {
    console.error("[GET_COURSES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}