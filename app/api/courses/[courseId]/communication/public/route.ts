import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await params;
    const courseIdNumber = parseInt(courseId, 10);

    // Find the user by providerId (Clerk ID)
    const user = await db.user.findUnique({
      where: {
        providerId: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user has access to the course (is enrolled)
    const userCourse = await db.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseIdNumber,
        },
      },
    });

    // If user is not enrolled, check if they are the course author
    if (!userCourse) {
      const course = await db.course.findFirst({
        where: {
          id: courseIdNumber,
          authorId: user.id,
        },
      });

      if (!course) {
        return new NextResponse("Access denied", { status: 403 });
      }
    }

    // Get all active communication links for the course
    const communicationLinks = await db.courseCommunication.findMany({
      where: {
        courseId: courseIdNumber,
        isActive: true, // Only return active links
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        platform: true,
        link: true,
        label: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        courseId: true,
      },
    });

    return NextResponse.json(communicationLinks);
  } catch (error) {
    console.error("[COMMUNICATION_LINKS_PUBLIC_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}