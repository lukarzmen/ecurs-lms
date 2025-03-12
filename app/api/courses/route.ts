import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Category, Course } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth() ?? "";
    const { title, description, categoryId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.create({
      data: {
        userId,
        title,
        categoryId: categoryId,
        description
      },
    });
    const response = new NextResponse(JSON.stringify(course), {
      status: 201,
    });
    return response;
  } catch (error) {
    console.error("Failed to create course", error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth() ?? "";
    const { courseId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.delete({
      where: {
        id: courseId,
        userId: userId,
      },
    });
    return new NextResponse("Course deleted", {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to delete course", error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}
export type CategoriesCourseAndModules = Course & {
  category: Category | null
  modules: { id: number }[]
};


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;

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

    const response = courses.map(course => ({
      ...course,
      modules: course.modules
    }));

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET_COURSES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
