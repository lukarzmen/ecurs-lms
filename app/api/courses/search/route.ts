import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Category, Course } from "@prisma/client";

export type LearningUnit = Course & {
  category: Category | null;
  author: {
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null; // Add displayName as optional
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
        author: { select: { firstName: true, lastName: true, displayName: true } },
        price: { select: { amount: true, currency: true, isRecurring: true, interval: true, trialPeriodDays: true, trialPeriodEnd: true, trialPeriodType: true } }
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
      }
    });

    // Map courses
    const mappedCourses = courses.map((course: any) => {
      const enrolled = enrolledCourseIds.includes(course.id);
      const authorDisplay = course.author?.displayName?.trim()
        ? course.author.displayName
        : `${course.author?.firstName ?? ""} ${course.author?.lastName ?? ""}`.trim();
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
        author: course.author
          ? { ...course.author, displayName: authorDisplay }
          : null,
        type: "course",
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

    const mappedPaths = await Promise.all(
      educationalPaths.map(async (path: any) => {
        // Fetch author
        let author = null;
        let authorDisplay = "";
        if (path.authorId) {
          const authorObj = await db.user.findUnique({
            where: { id: path.authorId },
            select: { firstName: true, lastName: true, displayName: true }
          });
          if (authorObj) {
            authorDisplay = authorObj.displayName?.trim()
              ? authorObj.displayName
              : `${authorObj.firstName ?? ""} ${authorObj.lastName ?? ""}`.trim();
            author = { ...authorObj, displayName: authorDisplay };
          }
        }
        // Fetch price
        const priceObj = await db.educationalPathPrice.findUnique({
          where: { educationalPathId: path.id },
        });
        // Fetch category
        let category = null;
        if (path.categoryId) {
          category = await db.category.findUnique({
            where: { id: path.categoryId }
          });
        }
        // Mark as enrolled if path.id is in enrolledEduPathIds
        const enrolled = enrolledEduPathIds.includes(path.id);
        return {
          ...path,
          enrolled,
          price: priceObj?.amount ?? null,
          currency: priceObj?.currency ?? null,
          isRecurring: priceObj?.isRecurring ?? false,
          interval: priceObj?.interval ?? null,
          trialPeriodDays: priceObj?.trialPeriodDays ?? null,
          trialPeriodEnd: priceObj?.trialPeriodEnd ?? null,
          trialPeriodType: priceObj?.trialPeriodType ?? null,
          author,
          category,
          type: "educationalPath",
          updatedAt: path.updatedAt,
        };
      })
    );

    // Union and sort by updatedAt desc
    const union = [...mappedCourses, ...mappedPaths].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json(union);

  } catch (error) {
    console.error("[GET_COURSES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}