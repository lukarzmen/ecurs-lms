import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: id } = await context.params;
    const educationalPathId = parseInt(id, 10);
    if (isNaN(educationalPathId)) {
      return NextResponse.json({ error: "Invalid educationalPathId" }, { status: 400 });
    }
    // Find all promo codes for this educational path via join table
    const pathPromoCodes = await prisma.educationalPathPromoCode.findMany({
      where: { educationalPathId },
      orderBy: { id: "desc" },
    });
    // Fetch promo codes for each join
    const promos = await Promise.all(pathPromoCodes.map(async cp => {
      return await prisma.promoCode.findUnique({ where: { id: cp.promoCodeId } });
    }));
    return NextResponse.json(promos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

const prisma = new PrismaClient();

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params;
    const educationalPathId = parseInt(courseId, 10);
    const body = await req.json();
    const { code, discount, description, expirationDate } = body;
    if (!code || !discount || isNaN(educationalPathId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Check for existing active promo code with same code for this educational path via join table
    const now = new Date();
    const existingPromo = await prisma.promoCode.findFirst({ where: { code } });
    if (existingPromo) {
      const existingJoin = await prisma.educationalPathPromoCode.findFirst({
        where: { educationalPathId, promoCodeId: existingPromo.id },
      });
      if (existingJoin && (!existingPromo.expirationDate || existingPromo.expirationDate > now)) {
        return NextResponse.json({ error: "Promo code already exists and is active for this educational path" }, { status: 409 });
      }
    }
    // Create promo code
    const promo = await prisma.promoCode.create({
      data: {
        code,
        discount: Number(discount),
        description,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      },
    });
    // Link promo code to educational path
    await prisma.educationalPathPromoCode.create({
      data: {
        educationalPathId,
        promoCodeId: promo.id,
      },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
