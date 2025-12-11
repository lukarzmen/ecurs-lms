import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Znajdź szkoły, które nauczyciel może dołączyć
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        companyName: true,
        ownerId: true,
        _count: {
          select: { teachers: true }
        }
      },
    });

    // Format response to include _count.members for frontend
    const formattedSchools = schools.map(school => ({
      ...school,
      _count: {
        members: school._count.teachers
      }
    }));

    return NextResponse.json(formattedSchools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
