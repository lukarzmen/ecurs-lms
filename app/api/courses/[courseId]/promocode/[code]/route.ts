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
    const promo = await prisma.promoCode.findFirst({
      where: { courseId, code },
    });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
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
    const deleted = await prisma.promoCode.deleteMany({
      where: { courseId, code },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Promo code deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
