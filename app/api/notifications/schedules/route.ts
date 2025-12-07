import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/notifications/schedules - Get all notification schedules for a user's school
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

    // Find user's school (owner or teacher member)
    const schoolIds = await db.school.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { teachers: { some: { teacherId: user.id } } },
        ],
      },
      select: { id: true },
    });

    if (schoolIds.length === 0) {
      return NextResponse.json([]);
    }

    const schoolIdList = schoolIds.map(s => s.id);

    const schedules = await db.notificationSchedule.findMany({
      where: {
        schoolId: { in: schoolIdList },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
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

// POST /api/notifications/schedules - Create a new notification schedule for a school
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
      schoolId,
      title,
      message,
      cronExpression,
      notificationType,
      isEnabled = true,
    } = body;

    // Validate required fields
    if (!schoolId || !title || !message || !cronExpression || !notificationType) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify the user is owner or teacher member of this school
    const school = await db.school.findFirst({
      where: {
        id: parseInt(schoolId),
        OR: [
          { ownerId: user.id },
          { teachers: { some: { teacherId: user.id } } },
        ],
      },
    });

    if (!school) {
      return new NextResponse('School not found or not authorized', { status: 404 });
    }

    // Validate cron expression format (basic validation)
    const cronParts = cronExpression.split(' ');
    if (cronParts.length !== 5) {
      return new NextResponse('Invalid cron expression format', { status: 400 });
    }

    const schedule = await db.notificationSchedule.create({
      data: {
        schoolId: parseInt(schoolId),
        title,
        message,
        cronExpression,
        notificationType,
        isEnabled,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
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