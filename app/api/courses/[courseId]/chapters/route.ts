import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Module, UserModule } from "@prisma/client"; // Import types
import { NextRequest, NextResponse } from "next/server";

// Define an enum-like type for progress states
type ProgressState = "NOT_STARTED" | "OPEN" | "FINISHED";

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
    const userId = req.nextUrl.searchParams.get("providerId"); // Get the providerId from the request URL
    console.log("[COURSE_ID_CHAPTERS_GET]", userId); // Log specific context
    if(!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const courseId = parseInt(params.courseId, 10);

    if (isNaN(courseId)) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }

    // Find the internal user ID
    const user = await db.user.findUnique({
        where: { providerId: userId }
      });
    

    const course = await db.course.findUnique({
      where: {
        id: courseId,
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

    // If user is found, fetch their progress for the modules in this course
    let userModulesMap: Map<number, UserModule> = new Map();
    if (user && course.modules.length > 0) {
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

    console.log("[COURSE_ID_CHAPTERS_GET]", courseId, userId, userModulesMap); // Log specific context
    // Add progressState to each module
    const modulesWithProgress: ModuleWithProgress[] = course.modules.map(module => {
      const userModule = userModulesMap.get(module.id);
      let progressState: ProgressState = "NOT_STARTED"; // Default to "NOT_STARTED"

      if (userModule) {
        if (userModule.isFinished) {
          progressState = "FINISHED"; // Finished
        } else if (userModule.isOpen) {
          progressState = "OPEN"; // Open
        }
        // If userModule exists but is neither finished nor open, it stays "NOT_STARTED"
      }

      return {
        ...module,
        progressState: progressState,
      };
    });

    // Return the course with modules including the progress state
    return NextResponse.json({ ...course, modules: modulesWithProgress });

  } catch (error) {
    console.error("[COURSE_ID_CHAPTERS_GET]", error); // Log specific context
    return new NextResponse("Internal Error", { status: 500 });
  }
}