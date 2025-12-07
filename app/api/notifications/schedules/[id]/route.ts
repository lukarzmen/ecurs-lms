import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/notifications/schedules/[id] - Get a specific notification schedule
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return new NextResponse('Invalid schedule ID', { status: 400 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const schedule = await db.notificationSchedule.findFirst({
      where: {
        id: scheduleId,
        school: {
          OR: [
            { ownerId: user.id },
            { teachers: { some: { teacherId: user.id } } },
          ],
        },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        sentLogs: {
          take: 20,
          orderBy: {
            sentAt: 'desc',
          },
          include: {
            recipient: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return new NextResponse('Notification schedule not found', { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('[NOTIFICATION_SCHEDULE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/notifications/schedules/[id] - Update a notification schedule
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return new NextResponse('Invalid schedule ID', { status: 400 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Verify the user has access to this schedule (via school membership)
    const existingSchedule = await db.notificationSchedule.findFirst({
      where: {
        id: scheduleId,
        school: {
          OR: [
            { ownerId: user.id },
            { teachers: { some: { teacherId: user.id } } },
          ],
        },
      },
    });

    if (!existingSchedule) {
      return new NextResponse('Notification schedule not found', { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      message,
      cronExpression,
      isEnabled,
      notificationType,
    } = body;

    // Prepare update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (cronExpression !== undefined) {
      // Validate cron expression format (basic validation)
      const cronParts = cronExpression.split(' ');
      if (cronParts.length !== 5) {
        return new NextResponse('Invalid cron expression format', { status: 400 });
      }
      updateData.cronExpression = cronExpression;
    }
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (notificationType !== undefined) updateData.notificationType = notificationType;

    const updatedSchedule = await db.notificationSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('[NOTIFICATION_SCHEDULE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/notifications/schedules/[id] - Delete a notification schedule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      return new NextResponse('Invalid schedule ID', { status: 400 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Verify the user has access to this schedule (via school membership)
    const existingSchedule = await db.notificationSchedule.findFirst({
      where: {
        id: scheduleId,
        school: {
          OR: [
            { ownerId: user.id },
            { teachers: { some: { teacherId: user.id } } },
          ],
        },
      },
    });

    if (!existingSchedule) {
      return new NextResponse('Notification schedule not found', { status: 404 });
    }

    await db.notificationSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({ message: 'Notification schedule deleted successfully' });
  } catch (error) {
    console.error('[NOTIFICATION_SCHEDULE_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}