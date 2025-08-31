import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, context: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await context.params;

  if (!moduleId) {
    return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { state } = body;

    if (typeof state !== "number" || state < 0 || state > 3) {
      return NextResponse.json({ error: "Invalid state value" }, { status: 400 });
    }

    const updatedModule = await prisma.module.update({
      where: { id: parseInt(moduleId, 10) },
      data: { state },
    });

    return NextResponse.json(updatedModule, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update module state" }, { status: 500 });
  }
}