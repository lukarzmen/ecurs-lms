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
    const vatRate = body.vatRate !== undefined ? Number(body.vatRate) : 23;

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
    
    if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
      return new NextResponse("Invalid VAT rate", { status: 400 });
    }

    // Use trialPeriodType to determine which field to set and nullify the other
    const trialPeriodType = body.trialPeriodType;
    let trialPeriodDays: number | undefined = undefined;
    let trialPeriodEnd: Date | undefined = undefined;
    if (trialPeriodType === "DAYS") {
      trialPeriodDays = body.trialPeriodDays !== undefined ? Number(body.trialPeriodDays) : undefined;
      if (trialPeriodDays !== undefined && (isNaN(trialPeriodDays) || trialPeriodDays < 0)) {
        return new NextResponse("Invalid trial period", { status: 400 });
      }
    }
    if (trialPeriodType === "DATE") {
      if (body.trialPeriodEnd) {
        const parsedDate = new Date(body.trialPeriodEnd);
        if (!isNaN(parsedDate.getTime())) {
          trialPeriodEnd = parsedDate;
        } else {
          return new NextResponse("Invalid trial period end date", { status: 400 });
        }
      }
    }
    const createData: any = {
      amount: new Prisma.Decimal(priceNumber),
      currency,
      isRecurring,
      course: { connect: { id: courseIdNumber } },
      trialPeriodType,
      trialPeriodDays: trialPeriodType === "DAYS" ? trialPeriodDays ?? null : null,
      trialPeriodEnd: trialPeriodType === "DATE" ? trialPeriodEnd ?? null : null,
      vatRate: new Prisma.Decimal(vatRate),
    };
    if (interval) createData.interval = interval;

    const updateData: any = {
      amount: new Prisma.Decimal(priceNumber),
      currency,
      isRecurring,
      trialPeriodType,
      trialPeriodDays: trialPeriodType === "DAYS" ? trialPeriodDays ?? null : null,
      trialPeriodEnd: trialPeriodType === "DATE" ? trialPeriodEnd ?? null : null,
      vatRate: new Prisma.Decimal(vatRate),
    };
    if (interval) updateData.interval = interval;

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
      trialPeriodType: upserted.trialPeriodType ?? null,
      trialPeriodDays: upserted.trialPeriodDays ?? null,
      trialPeriodEnd: upserted.trialPeriodEnd ?? null,
      vatRate: Number(upserted.vatRate.toString()),
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}