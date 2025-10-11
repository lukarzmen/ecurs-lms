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
    // Find promo code by code
    const promo = await prisma.promoCode.findFirst({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    // Check if promo code is linked to this educational path
    const join = await prisma.educationalPathPromoCode.findFirst({
      where: { educationalPathId, promoCodeId: promo.id },
    });
    if (!join) {
      return NextResponse.json({ error: "Promo code not found for this educational path" }, { status: 404 });
    }
    return NextResponse.json({ discount: promo.discount, promo }, { status: 200 });
  } catch (error) {
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
    // Find promo code by code
    const promo = await prisma.promoCode.findFirst({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }
    // Delete join entry
    const deleted = await prisma.educationalPathPromoCode.deleteMany({
      where: { educationalPathId, promoCodeId: promo.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Promo code not found for this educational path" }, { status: 404 });
    }
    return NextResponse.json({ message: "Promo code unlinked from educational path" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
