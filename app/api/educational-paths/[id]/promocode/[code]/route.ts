import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, code: string }> }) {
  try {
    const awaitedParams = await params;
    const educationalPathId = parseInt(awaitedParams.id, 10);
    const code = awaitedParams.code;
    if (!code || isNaN(educationalPathId)) {
      return NextResponse.json({ error: "Missing code or invalid educationalPathId" }, { status: 400 });
    }
    // Get all joins for this educational path
    const joins = await prisma.educationalPathPromoCode.findMany({
      where: { educationalPathId },
    });
    if (!joins.length) {
      return NextResponse.json({ error: "No promo codes for this educational path" }, { status: 404 });
    }
    // Get all promoCodeIds for this path
    const promoCodeIds = joins.map(j => j.promoCodeId);
    // Find promoCode with matching code and id
    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code,
        id: { in: promoCodeIds },
      },
    });
    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found for this educational path" }, { status: 404 });
    }
    return NextResponse.json({ discount: promoCode.discount, promo: promoCode }, { status: 200 });
  } catch (error) {
    console.error("GET /api/educational-paths/[id]/promocode/[code] error:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, code: string }> }) {
  try {
    const awaitedParams = await params;
    const educationalPathId = parseInt(awaitedParams.id, 10);
    const code = awaitedParams.code;
    if (!code || isNaN(educationalPathId)) {
      return NextResponse.json({ error: "Missing code or invalid educationalPathId" }, { status: 400 });
    }
    // Find promoCode by code
    const promoCode = await prisma.promoCode.findFirst({ where: { code } });
    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    // Find join entry for this educational path and promoCode
    const join = await prisma.educationalPathPromoCode.findFirst({
      where: {
        educationalPathId,
        promoCodeId: promoCode.id,
      },
    });
    if (!join) {
      return NextResponse.json({ error: "Promo code not found for this educational path" }, { status: 404 });
    }
    // Delete join entry
    await prisma.educationalPathPromoCode.delete({ where: { id: join.id } });
    return NextResponse.json({ message: "Promo code unlinked from educational path" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/educational-paths/[id]/promocode/[code] error:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
