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
    // Find promo code by code
    const promo = await prisma.promoCode.findFirst({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    // Check if promo code is linked to this course
    const join = await prisma.coursePromoCode.findFirst({
      where: { courseId, promoCodeId: promo.id },
    });
    if (!join) {
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
