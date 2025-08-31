import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await context.params;
    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }
    const promos = await prisma.promoCode.findMany({
      where: { courseId: courseIdNum },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(promos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

const prisma = new PrismaClient();

export async function POST(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await context.params;
    const courseIdNum = parseInt(courseId, 10);
    const body = await req.json();
    const { code, discount, description, expirationDate } = body;
    if (!code || !discount || isNaN(courseIdNum)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Check for existing active promo code with same code for this course
    const now = new Date();
    const existing = await prisma.promoCode.findFirst({
      where: {
        code,
        courseId: courseIdNum,
        OR: [
          { expirationDate: null },
          { expirationDate: { gt: now } },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Promo code already exists and is active for this course" }, { status: 409 });
    }
    const promo = await prisma.promoCode.create({
      data: {
        code,
        discount: Number(discount),
        description,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        courseId: courseIdNum,
      },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
