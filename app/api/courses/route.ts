import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  request: Request;
  {
    try {
      const { userId } = auth() ?? "";
      const { title, description, categoryId } = await req.json();

      if (!userId) {
        return new NextResponse("Unauthorized", {
          status: 401,
        });
      }
      const course = await db.course.create({
        data: {
          userId,
          title,
          categoryId: categoryId,
          description
        },
      });
      const response = new NextResponse(JSON.stringify(course), {
        status: 201,
      });
      return response;
    } catch (error) {
      console.error("Failed to create course", error);
      return new NextResponse("Internal error", {
        status: 500,
      });
    }
  }
}


