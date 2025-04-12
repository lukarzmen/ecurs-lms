import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Category, Course } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, description, categoryId, userProviderId } = await req.json();

    if (!userProviderId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const user = await db.user.findUnique({
      where: {
        providerId: userProviderId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const course = await db.course.create({
      data: {
        authorId: user.id,
        title,
        categoryId: categoryId,
        description
      },
    });

    await db.userCourse.create({
      data: {
        userId: user.id,
        courseId: course.id,
        state: 1,
        roleId: 1, // Assuming 1 is the role ID for the teacher
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
    await db.course.delete({
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
      status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {

    const courses = await db.course.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.log("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


