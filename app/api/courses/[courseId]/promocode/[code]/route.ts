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
    // Get all joins for this course
    const joins = await prisma.coursePromoCode.findMany({
      where: { courseId },
    });
    if (!joins.length) {
      return NextResponse.json({ error: "No promo codes for this course" }, { status: 404 });
    }
    // Get all promoCodeIds for this course
    const promoCodeIds = joins.map(j => j.promoCodeId);
    // Find promoCode with matching code and id
    const promo = await prisma.promoCode.findFirst({
      where: {
        code,
        id: { in: promoCodeIds },
      },
    });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found for this course" }, { status: 404 });
    }
    return NextResponse.json({ discount: promo.discount, promo }, { status: 200 });
  } catch (error) {
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
    // Find promo code by code
    const promo = await prisma.promoCode.findFirst({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    // Delete join entry
    const deleted = await prisma.coursePromoCode.deleteMany({
      where: { courseId, promoCodeId: promo.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Promo code not found for this course" }, { status: 404 });
    }
    return NextResponse.json({ message: "Promo code unlinked from course" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
