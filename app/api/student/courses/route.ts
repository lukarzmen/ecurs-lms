import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user courses with purchase information
    const userCourses = await db.userCourse.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageId: true,
          },
        },
        purchase: {
          select: {
            id: true,
            subscriptionId: true,
            isRecurring: true,
            subscriptionStatus: true,
            currentPeriodEnd: true,
            amount: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json(userCourses);

  } catch (error) {
    console.error('Error fetching user courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}