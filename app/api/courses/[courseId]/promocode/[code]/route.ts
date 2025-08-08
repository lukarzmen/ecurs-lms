import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { courseId: string, code: string } }) {
  try {
    const courseId = parseInt(params.courseId, 10);
    const code = params.code;
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
