import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CommunicationPlatform } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, id } = await params;
    const courseIdNumber = parseInt(courseId, 10);
    const linkId = parseInt(id, 10);
    const { platform, link, label, description, isActive } = await req.json();

    // Find the user by providerId (Clerk ID)
    const user = await db.user.findUnique({
      where: {
        providerId: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify user owns the course
    const course = await db.course.findFirst({
      where: {
        id: courseIdNumber,
        authorId: user.id, // Use the database user ID
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Update the communication link
    const updatedLink = await db.courseCommunication.update({
      where: {
        id: linkId,
        courseId: courseIdNumber, // Ensure the link belongs to this course
      },
      data: {
        platform,
        link,
        label: label || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error("[COMMUNICATION_LINK_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, id } = await params;
    const courseIdNumber = parseInt(courseId, 10);
    const linkId = parseInt(id, 10);

    // Find the user by providerId (Clerk ID)
    const user = await db.user.findUnique({
      where: {
        providerId: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify user owns the course
    const course = await db.course.findFirst({
      where: {
        id: courseIdNumber,
        authorId: user.id, // Use the database user ID
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Delete the communication link
    await db.courseCommunication.delete({
      where: {
        id: linkId,
        courseId: courseIdNumber, // Ensure the link belongs to this course
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COMMUNICATION_LINK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}