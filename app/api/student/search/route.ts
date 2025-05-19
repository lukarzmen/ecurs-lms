import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json([]);
  }

  const users = await db.user.findMany({
    where: {
      displayName: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 5,
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json(users);
}