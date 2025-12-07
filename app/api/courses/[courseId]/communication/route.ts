import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CommunicationPlatform } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await params;
    const courseIdNumber = parseInt(courseId, 10);

    // Verify user owns the course
    const course = await db.course.findFirst({
      where: {
        id: courseIdNumber
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Get all communication links for the course
    const communicationLinks = await db.courseCommunication.findMany({
      where: {
        courseId: courseIdNumber,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(communicationLinks);
  } catch (error) {
    console.error("[COMMUNICATION_LINKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = await params;
    const courseIdNumber = parseInt(courseId, 10);
    const { platform, link, label, description } = await req.json();

    // Validate required fields
    if (!platform || !link) {
      return new NextResponse("Platform and link are required", { status: 400 });
    }

    // Validate platform
    if (!Object.values(CommunicationPlatform).includes(platform as CommunicationPlatform)) {
      return new NextResponse("Invalid platform", { status: 400 });
    }

    // Verify user owns the course
    const course = await db.course.findFirst({
      where: {
        id: courseIdNumber
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Create the communication link
    const communicationLink = await db.courseCommunication.create({
      data: {
        courseId: courseIdNumber,
        platform,
        link,
        label: label || null,
        description: description || null,
      },
    });

    return NextResponse.json(communicationLink);
  } catch (error) {
    console.error("[COMMUNICATION_LINK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}