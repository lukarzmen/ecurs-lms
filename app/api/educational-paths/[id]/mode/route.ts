import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { mode } = await req.json();
    const params = await context.params;
    const eduPathId = parseInt(params.id, 10);

    if (isNaN(eduPathId) || (mode !== 0 && mode !== 1)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    await db.educationalPath.update({
      where: { id: eduPathId },
      data: { 
        mode: mode 
      },
    });

    return new NextResponse("OK");
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}