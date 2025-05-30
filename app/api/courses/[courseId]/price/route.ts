import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { price } = await req.json();
    const courseId = parseInt(params.courseId, 10);

    if (isNaN(courseId) || price === undefined || price < 0) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { price },
    });

    return NextResponse.json({ price: updated.price });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}