import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userProviderId = searchParams.get("userId");
    if (!userProviderId) {
      return NextResponse.json([], { status: 200 });
    }
    let user;
    try {
      user = await db.user.findUnique({
      where: { providerId: userProviderId },
      select: { id: true },
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      return NextResponse.json([], { status: 500 });
    }
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    const paths = await db.educationalPath.findMany({
      where: {
          authorId: user.id,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(paths);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, courseIds, userProviderId } = await req.json();
    if (!userProviderId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    // Find user and check if teacher
    const user = await db.user.findUnique({
      where: { providerId: userProviderId },
      select: { id: true, roleId: true },
    });
    if (!user || user.roleId !== 1) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Create educational path
    const educationalPath = await db.educationalPath.create({
      data: {
        title,
        description,
        authorId: user.id,
        courses: {
          create: courseIds.map((courseId: number, idx: number) => ({
            course: { connect: { id: courseId } },
            position: idx + 1,
          })),
        },
      },
      include: { courses: true },
    });

    // Add UserEducationalPath for the author (teacher)
    await db.userEducationalPath.create({
      data: {
        userId: user.id,
        educationalPathId: educationalPath.id,
        state: 1,
        roleId: 1, // Assuming 1 is the role ID for the teacher
      },
    });
    await db.educationalPathPrice.create({
      data: {
        educationalPathId: educationalPath.id,
        currency: "PLN",
        amount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(educationalPath);
  } catch (error) {
    console.error("Failed to create educational path", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
