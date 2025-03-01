import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
    res: Response,
) {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
   
    return NextResponse.json(categories);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}