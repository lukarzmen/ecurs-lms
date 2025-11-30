import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, reason } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz prośbę dołączenia
    const joinRequest = await db.teacherJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        school: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Sprawdź czy user jest właścicielem szkoły
    if (joinRequest.school.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only school owner can reject requests" },
        { status: 403 }
      );
    }

    // Zaktualizuj status prośby
    const updatedRequest = await db.teacherJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        respondedAt: new Date(),
        rejectionReason: reason || null,
      },
    });

    return NextResponse.json({
      message: "Request rejected",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
