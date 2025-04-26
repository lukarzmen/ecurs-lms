import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } },
) {
  try {
    const courseIdInt = parseInt(params.courseId, 10);
    const ownCourse = await db.course.findFirst({
      where: {
        id: courseIdInt
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const chapterIdInt = parseInt(params.chapterId, 10);
    await db.module.delete({
      where: {
      id: chapterIdInt,
      },
    });

    return new NextResponse("Chapter deleted successfully", { status: 200 });
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } },
) {
  try {
    const courseIdInt = parseInt(params.courseId, 10);
    const chapterIdInt = parseInt(params.chapterId, 10);
    const { isPublished, ...values } = await req.json();
    const chapter = await db.module.update({
      where: {
        id: chapterIdInt,
      },
      data: {
        ...values,
      },
    });
    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new Response("Internal server error", { status: 500 });
  }
}


export async function GET(
  req: Request, // Add req parameter
  { params }: { params: { courseId: string; chapterId: string } },
) {
  try {
    const { searchParams } = new URL(req.url);
    const { userId } = auth(); // Get userId from auth
    const courseIdInt = parseInt(params.courseId, 10);
    const chapterIdInt = parseInt(params.chapterId, 10);

    // Validate IDs
    if (isNaN(courseIdInt) || isNaN(chapterIdInt)) {
        return new NextResponse("Invalid course or chapter ID", { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseIdInt
      },
    });

    const module = await db.module.findUnique({
      where: {
        id: chapterIdInt,
        courseId: courseIdInt, // Ensure chapter belongs to the course
      },
    });

    if (!module || !course) {
      return new NextResponse("Chapter or course not found", {
        status: 404,
      });
    }

    let userModule = null;

    // If providerId is provided, find or create UserModule
    if (userId) {
        const user = await db.user.findUnique({
            where: { providerId: userId }
        });

        if (user) {
            // Use upsert to find existing or create a new UserModule entry
            userModule = await db.userModule.upsert({
                where: {
                    userId_moduleId: { // Use the compound unique key
                        userId: user.id,
                        moduleId: chapterIdInt,
                    }
                },
                create: {
                    userId: user.id,
                    moduleId: chapterIdInt,
                    isOpen: true, // Default to opened on creation
                    createdAt: new Date(), // Set created timestamp
                    updatedAt: new Date(), // Set updated timestamp
                    isFinished: false, // Default to not finished on creation
                    // Add other default fields if necessary
                },
                update: {
                    isOpen: true, // Update the isOpen field if it exists
                    updatedAt: new Date(), // Update the timestamp
                }
            });
        } else {
            // Handle case where user is not found (optional, depends on requirements)
            // Could return 404 or proceed without userModule data
            console.warn(`User with providerId ${userId} not found while fetching chapter.`);
        }
    }

    // Return module, course, and userModule (which will be null if no providerId or user found)
    return NextResponse.json({ module, course, userModule });

  } catch (error) {
    console.error("[GET_CHAPTER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
