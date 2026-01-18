import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    // Get user from database
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          userExists: false,
          isMemberOfSchool: false,
          ownsSchool: false,
          hasPendingRequests: false,
          memberSchools: [],
          ownedSchools: [],
          pendingRequests: [],
        },
        { status: 200 }
      );
    }

    // Check if user belongs to any school (is member)
    const memberSchools = await db.schoolTeacher.findMany({
      where: { teacherId: user.id },
      select: {
        school: {
          select: { id: true, name: true, ownerId: true }
        }
      }
    });

    // Check if user owns a school
    const ownedSchools = await db.school.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true }
    });

    // Check pending join requests
    const pendingRequests = await db.teacherJoinRequest.findMany({
      where: {
        teacherId: user.id,
        status: "pending"
      },
      select: {
        id: true,
        schoolId: true,
        school: {
          select: { id: true, name: true, owner: { select: { displayName: true, email: true } } }
        },
        requestedAt: true
      }
    });

    const isMemberOfSchool = memberSchools.length > 0;
    const ownsSchool = ownedSchools.length > 0;
    const hasPendingRequests = pendingRequests.length > 0;

    return NextResponse.json({
      isMemberOfSchool,
      ownsSchool,
      hasPendingRequests,
      memberSchools: memberSchools.map(ms => ms.school),
      ownedSchools,
      pendingRequests: pendingRequests.map(req => ({
        id: req.id,
        schoolId: req.schoolId,
        schoolName: req.school.name,
        ownerName: req.school.owner?.displayName || "Właściciel",
        ownerEmail: req.school.owner?.email || "",
        requestedAt: req.requestedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching school status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
