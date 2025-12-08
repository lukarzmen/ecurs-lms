import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, companyName, taxId } = await req.json();

    if (!name || !companyName || !taxId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { 
        id: true, 
        roleId: true,
        ownedSchools: {
          select: { id: true },
          take: 1
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if teacher already has a school (they should from registration)
    // Teachers can only have one school
    if (user.roleId === 1 && user.ownedSchools && user.ownedSchools.length > 0) {
      return NextResponse.json(
        { error: "Nauczyciele mogą posiadać tylko jedną szkołę. Skontaktuj się z administratorem, aby zarządzać swoją szkołą." },
        { status: 403 }
      );
    }

    // Teachers must have a school from registration, but allow creation if missing
    // This is for backward compatibility or edge cases

    // Create the school
    const school = await db.school.create({
      data: {
        name,
        description: description || null,
        companyName,
        taxId,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
