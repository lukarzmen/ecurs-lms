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
    
    // Get all schools where user is a teacher
    const userSchools = await db.schoolTeacher.findMany({
      where: { teacherId: user.id },
      select: { schoolId: true }
    });
    const schoolIds = userSchools.map(st => st.schoolId);
    
    // Find educational paths where:
    // 1. User is the author OR
    // 2. Path belongs to one of user's schools
    const paths = await db.educationalPath.findMany({
      where: {
        OR: [
          // Paths created by the user
          { authorId: user.id },
          // Paths belonging to schools where user is a member
          { schoolId: { in: schoolIds } }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { displayName: true, email: true }
        },
        school: {
          select: { id: true, name: true, ownerId: true }
        }
      }
    });
    return NextResponse.json(paths);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, courseIds, userProviderId } = await req.json();
    if (!userProviderId || !title) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    // Find user and check if teacher
    const user = await db.user.findUnique({
      where: { providerId: userProviderId },
      include: {
        ownedSchools: {
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user || user.roleId !== 1) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get teacher's school
    let schoolId = null;
    if (user.ownedSchools && user.ownedSchools.length > 0) {
      schoolId = user.ownedSchools[0].id;
    }

    // Create educational path
    const educationalPath = await db.educationalPath.create({
      data: {
        title,
        description: description || null,
        authorId: user.id,
        schoolId: schoolId,
        ...(courseIds && Array.isArray(courseIds) && courseIds.length > 0 && {
          courses: {
            create: courseIds.map((courseId: number, idx: number) => ({
              courseId: courseId,
              position: idx + 1,
            })),
          },
        }),
      },
      include: { courses: true },
    });

    // Add UserEducationalPath for the author (teacher)
    await db.userEducationalPath.create({
      data: {
        userId: user.id,
        educationalPathId: educationalPath.id,
        state: 1,
        updatedAt: new Date(),
        createdAt: new Date(),
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
