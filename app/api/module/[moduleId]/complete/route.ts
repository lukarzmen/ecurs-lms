import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Assuming your Prisma client is exported from here

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const awaitedParams = await params;
    const moduleId = parseInt(awaitedParams.moduleId, 10);

    if (!providerId) {
      return new NextResponse('Provider ID is required', { status: 400 });
    }

    if (isNaN(moduleId)) {
        return new NextResponse('Invalid Module ID', { status: 400 });
    }

    // 1. Find the user by providerId
    const user = await db.user.findUnique({
      where: { providerId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // 2. Get module to check course access and content
    const moduleData = await db.module.findUnique({
      where: { id: moduleId },
      include: {
        ModuleContent: true,
        course: {
          include: {
            userCourses: {
              where: {
                userId: user.id,
              },
            },
          },
        },
      },
    });

    if (!moduleData) {
      return new NextResponse('Module not found', { status: 404 });
    }

    // 3. Check if module is active (state = 1)
    if (moduleData.state !== 1) {
      return new NextResponse('Module is not active', { status: 403 });
    }

    // 4. Check if user has active access (state = 1)
    const userCourse = moduleData.course?.userCourses?.[0];
    if (!userCourse || userCourse.state !== 1) {
      return new NextResponse('No active access to this course', { status: 403 });
    }

    // 5. Check if module has content
    const hasContent = moduleData.ModuleContent && moduleData.ModuleContent.length > 0;
    if (!hasContent) {
      return new NextResponse('Module has no content to complete', { status: 400 });
    }

    // 6. Find and update the UserModule
    const updatedUserModule = await db.userModule.update({
      where: {
        userId_moduleId: { // Using the @@unique constraint
          userId: user.id,
          moduleId: moduleId,
        },
      },
      data: {
        isFinished: true,
      },
    });

    return NextResponse.json(updatedUserModule);

  } catch (error) {
    console.error("[MODULE_PROGRESS_UPDATE]", error);

    // Handle specific Prisma error for record not found during update
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return new NextResponse('User module association not found', { status: 404 });
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}