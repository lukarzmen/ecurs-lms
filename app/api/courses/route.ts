import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, description, categoryId, userProviderId, price } = await req.json();

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
        description,
        price
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
    const { courseId } = await req.json();

    // Najpierw sprawdź, czy kurs istnieje
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    await db.course.delete({
      where: { id: courseId },
    });

    return new NextResponse("Course deleted", { status: 200 });
  } catch (error) {
    console.error("Failed to delete course", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Correct way to get search params in Next.js API routes
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId"); // This is the providerId
  
  if (!userId) {
    return new NextResponse("User parameter not passed", { status: 400 }); // Changed status to 400
  }

  const user = await db.user.findUnique({
    where: { providerId: userId },
    select: { id: true }, // Only select the id needed for the query
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  try {
    // Find courses where the user is associated via UserCourse with roleId 0
    const courses = await db.course.findMany({
      where: {
        userCourses: { // Filter based on the related UserCourse records
          some: {       // Check if at least one UserCourse matches
            userId: user.id, // Match the user's internal database ID
            roleId: 1,       // Filter for roleId 0 (as requested)
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      // Consider including related data if needed by the client
      // include: {
      //   category: true,
      //   author: { select: { displayName: true } }
      // }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.log("[COURSES_GET_TEACHER]", error); // Updated log identifier
    return new NextResponse("Internal Error", { status: 500 });
  }
}


