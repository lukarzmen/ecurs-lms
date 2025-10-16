import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string, code: string }> }) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.courseId, 10);
    const code = awaitedParams.code;
    if (!code || isNaN(courseId)) {
      return NextResponse.json({ error: "Missing code or invalid courseId" }, { status: 400 });
    }
    // Find all join entries for this course
    const joins = await prisma.coursePromoCode.findMany({ where: { courseId } });
    let foundPromo = null;
    let foundJoin = null;
    for (const join of joins) {
      const promo = await prisma.promoCode.findUnique({ where: { id: join.promoCodeId } });
      if (promo && promo.code === code) {
        foundPromo = promo;
        foundJoin = join;
        break;
      }
    }
    if (!foundPromo) {
      console.error('GET 404: Promo code not linked to this course', { courseId, code });
      return NextResponse.json({ error: "Promo code not found for this course" }, { status: 404 });
    }
    return NextResponse.json({ discount: foundPromo.discount, promo: foundPromo }, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses/[courseId]/promocode/[code] error:', error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ courseId: string, code: string }> }) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.courseId, 10);
    const code = awaitedParams.code;
    if (!code || isNaN(courseId)) {
      return NextResponse.json({ error: "Missing code or invalid courseId" }, { status: 400 });
    }
    // Find all join entries for this course
    const joins = await prisma.coursePromoCode.findMany({ where: { courseId } });
    let foundJoin = null;
    for (const join of joins) {
      const promo = await prisma.promoCode.findUnique({ where: { id: join.promoCodeId } });
      if (promo && promo.code === code) {
        foundJoin = join;
        break;
      }
    }
    if (!foundJoin) {
      console.error('DELETE 404: Promo code not linked to this course', { courseId, code });
      return NextResponse.json({ error: "Promo code not found for this course" }, { status: 404 });
    }
    // Delete join entry
    await prisma.coursePromoCode.delete({ where: { id: foundJoin.id } });
    return NextResponse.json({ message: "Promo code unlinked from course" }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/courses/[courseId]/promocode/[code] error:', error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
