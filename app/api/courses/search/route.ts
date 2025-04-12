import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { CourseDetails, CourseWithCategory } from "../../user/courses/route";

export async function GET(req: NextRequest) : Promise<NextResponse<CourseDetails[] | { error: string }>> {
    const { searchParams } = req.nextUrl;
    const title = searchParams.get('title') || undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;

    try {
      const courses = await db.course.findMany({
        where: {
          title: {
        contains: title,
        mode: "insensitive",
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
  
      const response: CourseDetails[] = courses.map((course: CourseWithCategory) => {
            const modules = course.modules;
            const lastModuleId = modules.length > 0 ? Math.max(...modules.map(module => module.id)) : 0;
    
            return {
                ...course,
                modulesCount: modules.length,
                nonFinishedModuleId: lastModuleId,
            };
          });
      
          return NextResponse.json(response);
  
    } catch (error) {
      console.error("[GET_COURSES]", error);
      return new NextResponse("Internal error", { status: 500 });
    }
  }