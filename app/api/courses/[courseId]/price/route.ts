import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const body = await req.json();
    // Accept either { price } (legacy) or { amount } (new) and optional currency/isRecurring/interval
    const rawPrice = body.price ?? body.amount;
    const currency = (body.currency as string) ?? "PLN"; // assumption: default to PLN when not provided
    const isRecurring = body.isRecurring === undefined ? false : Boolean(body.isRecurring);
    const interval = body.interval as string | undefined;

    const { courseId } = await params;
    const courseIdNumber = parseInt(courseId, 10);

    // Basic validation
    const priceNumber = Number(rawPrice);
    const allowedIntervals = ["ONE_TIME", "MONTH", "YEAR"];

    if (isNaN(courseIdNumber) || isNaN(priceNumber) || priceNumber < 0) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    if (typeof currency !== "string" || currency.trim() === "") {
      return new NextResponse("Invalid currency", { status: 400 });
    }

    if (interval !== undefined && !allowedIntervals.includes(interval)) {
      return new NextResponse("Invalid interval", { status: 400 });
    }

    // Build create and update payloads conditionally so we don't set undefined fields
    const trialPeriodDays = body.trialPeriodDays !== undefined ? Number(body.trialPeriodDays) : undefined;
    if (trialPeriodDays !== undefined && (isNaN(trialPeriodDays) || trialPeriodDays < 0)) {
      return new NextResponse("Invalid trial period", { status: 400 });
    }
    const createData: any = {
      amount: new Prisma.Decimal(priceNumber),
      currency,
      isRecurring,
      course: { connect: { id: courseIdNumber } },
    };
    if (interval) createData.interval = interval;
    if (trialPeriodDays !== undefined) createData.trialPeriodDays = trialPeriodDays;

    const updateData: any = {
      amount: new Prisma.Decimal(priceNumber),
      currency,
      isRecurring,
    };
    if (interval) updateData.interval = interval;
    if (trialPeriodDays !== undefined) updateData.trialPeriodDays = trialPeriodDays;

    const upserted = await prisma.coursePrice.upsert({
      where: { courseId: courseIdNumber },
      create: createData,
      update: updateData,
    });

    return NextResponse.json({
      amount: Number(upserted.amount.toString()),
      currency: upserted.currency,
      isRecurring: upserted.isRecurring,
      interval: upserted.interval,
      trialPeriodDays: upserted.trialPeriodDays ?? null,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}