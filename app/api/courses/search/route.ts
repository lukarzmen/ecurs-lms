import { db } from "@/lib/db";
import { Category, Course } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const title = searchParams.get('title') || undefined;
      const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
  
      const courses = await db.course.findMany({
        where: {
          title: {
            contains: title,
          },
          categoryId: categoryId
        },
        include: {
          category: true,
          modules: {
            select: {
              id: true
            }
          },
        },
        orderBy: {
          createdAt: "desc"
        }
      });
  
      const response = courses.map(course => ({
        ...course,
        modules: course.modules
      }));
  
      return NextResponse.json(response);
  
    } catch (error) {
      console.error("[GET_COURSES]", error);
      return new NextResponse("Internal error", { status: 500 });
    }
  }