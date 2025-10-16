import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET(req: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await context.params;
    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }
    // Find all promo codes for this course via join table
    const coursePromoCodes = await prisma.coursePromoCode.findMany({
      where: { courseId: courseIdNum },
      orderBy: { id: "desc" },
    });
    // Fetch promo codes for each join
    const promos = await Promise.all(coursePromoCodes.map(async cp => {
      return await prisma.promoCode.findUnique({ where: { id: cp.promoCodeId } });
    }));
    // Filter out any null promo codes
    const validPromos = promos.filter(Boolean);
    return NextResponse.json(validPromos, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses/[courseId]/promocode error:', error);
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
    // Check for existing active promo code with same code for this course via join table
    const now = new Date();
    const existingPromo = await prisma.promoCode.findFirst({ where: { code } });
    if (existingPromo) {
      const existingJoin = await prisma.coursePromoCode.findFirst({
        where: { courseId: courseIdNum, promoCodeId: existingPromo.id },
      });
      if (existingJoin && (!existingPromo.expirationDate || existingPromo.expirationDate > now)) {
        return NextResponse.json({ error: "Promo code already exists and is active for this course" }, { status: 409 });
      }
    }
    // Create promo code
    const promo = await prisma.promoCode.create({
      data: {
        code,
        discount: Number(discount),
        createdAt: new Date(),
        updatedAt: new Date(),
        description,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      },
    });
    // Link promo code to course
    await prisma.coursePromoCode.create({
      data: {
        courseId: courseIdNum,
        promoCodeId: promo.id,
      },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    console.error('POST /api/courses/[courseId]/promocode error:', error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
