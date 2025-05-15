import { ProgressState } from "@/app/(course)/courses/[courseId]/_components/course-mobile-sidebar";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Module, UserModule } from "@prisma/client"; // Import types
import { NextRequest, NextResponse } from "next/server";


// Define an interface for the module with the added progress state
interface ModuleWithProgress extends Module {
  progressState: ProgressState;
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) { 
  const { courseId } = params;
  const courseIdInt = parseInt(courseId, 10);
  if (isNaN(courseIdInt)) {
    return new NextResponse("Invalid courseId", {
      status: 400,
    });
  }
  try {
    const { title } = await req.json();


    const lastChapters = await db.module.findFirst({
      where: {
        courseId: courseIdInt
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapters ? lastChapters.position + 1 : 1;

    const chapter = await db.module.create({
      data: {
        courseId: courseIdInt,
        position: newPosition,
        title: title,
      },
    });
    return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTERS_POST]", error); // Log specific context
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const providerId = req.nextUrl.searchParams.get("providerId"); // Get the providerId from the request URL
    if(!providerId) {
      return new NextResponse("Unauthorized - Missing providerId", { status: 401 });
    }
    const courseIdInt = parseInt(params.courseId, 10);

    if (isNaN(courseIdInt)) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }

    // Find the internal user ID
    const user = await db.user.findUnique({
        where: { providerId: providerId }
      });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseIdInt,
      },
      include: {
        modules: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Fetch UserCourse to determine overall course access state
    const userCourse = await db.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseIdInt,
        },
      },
    });


    // If user is found and course is active (state 1), fetch their progress for the modules
    let userModulesMap: Map<number, UserModule> = new Map();
    if (userCourse && userCourse.state === 1 && course.modules.length > 0) {
      const moduleIds = course.modules.map(m => m.id);
      const userModules = await db.userModule.findMany({
        where: {
          userId: user.id,
          moduleId: {
            in: moduleIds
          }
        }
      });
      userModules.forEach(um => userModulesMap.set(um.moduleId, um));
    }

    // Add progressState to each module
    const modulesWithProgress: ModuleWithProgress[] = course.modules.map(module => {
      let progressState: ProgressState = "LOCKED"; // Default to "LOCKED"

      if (userCourse && userCourse.state === 1) { // Course is active for the user
        const userModule = userModulesMap.get(module.id);
        if (userModule) {
          if (userModule.isFinished) {
            progressState = "FINISHED";
          } else if (userModule.isOpen) {
            progressState = "OPEN";
          } else {
            // UserModule exists but is not finished and not open
            progressState = "AVAILABLE"; 
          }
        } else {
          // No UserModule for this module, but course is active
          progressState = "AVAILABLE"; 
        }
      } 
      // If userCourse doesn't exist or state is 0, progressState remains "LOCKED"

      return {
        ...module,
        progressState: progressState,
      };
    });
    console.log("[COURSE_ID_CHAPTERS_GET] Modules with progress calculated:", modulesWithProgress.length);

    // Return the course with modules including the progress state
    return NextResponse.json({ ...course, modules: modulesWithProgress });

  } catch (error) {
    console.error("[COURSE_ID_CHAPTERS_GET] Error:", error); 
    return new NextResponse("Internal Error", { status: 500 });
  }
}