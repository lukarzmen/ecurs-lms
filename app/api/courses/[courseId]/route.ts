import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  const { courseId } = params;
  const values = await req.json();
  
  console.log(values);
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.update({
      where: {
        id: courseId,
        userId,
      },
      data: {
        ...values,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  const { courseId } = params;
  const { imageUrl } = await req.json();
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.update({
      where: {
        id: courseId,
        userId,
      },
      data: {
        imageUrl: imageUrl,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const ownCourse = await db.course.findFirst({
      where: {
        id: params.courseId,
        userId,
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const deletedCourse = await db.course.delete({
      where: {
        id: params.courseId,
        userId: userId,
      },
      include: {
        chapters: true,
      },
    });
    if (!deletedCourse) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.log("[COURSES_ID]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
