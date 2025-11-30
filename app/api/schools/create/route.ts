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
      select: { id: true, businessType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.businessType !== "company") {
      return NextResponse.json(
        { error: "Only company users can create schools" },
        { status: 403 }
      );
    }

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
