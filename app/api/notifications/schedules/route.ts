import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/notifications/schedules - Get all notification schedules for a user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let whereClause: any = {
      authorId: user.id,
    };

    if (courseId) {
      whereClause.courseId = parseInt(courseId);
    }

    const schedules = await db.notificationSchedule.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        sentLogs: {
          take: 5,
          orderBy: {
            sentAt: 'desc',
          },
          select: {
            id: true,
            sentAt: true,
            status: true,
            recipientEmail: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('[NOTIFICATION_SCHEDULES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/notifications/schedules - Create a new notification schedule
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await req.json();
    const {
      courseId,
      title,
      message,
      cronExpression,
      notificationType,
      isEnabled = true,
    } = body;

    // Validate required fields
    if (!courseId || !title || !message || !cronExpression || !notificationType) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify the user owns the course
    const course = await db.course.findFirst({
      where: {
        id: parseInt(courseId),
        authorId: user.id,
      },
    });

    if (!course) {
      return new NextResponse('Course not found or not authorized', { status: 404 });
    }

    // Validate cron expression format (basic validation)
    const cronParts = cronExpression.split(' ');
    if (cronParts.length !== 5) {
      return new NextResponse('Invalid cron expression format', { status: 400 });
    }

    const schedule = await db.notificationSchedule.create({
      data: {
        courseId: parseInt(courseId),
        authorId: user.id,
        title,
        message,
        cronExpression,
        notificationType,
        isEnabled,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('[NOTIFICATION_SCHEDULES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}