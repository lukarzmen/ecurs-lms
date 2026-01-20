import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userCourseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await request.json();
    const resolvedParams = await params;
    const userCourseId = parseInt(resolvedParams.userCourseId);

    if (!userCourseId) {
      return NextResponse.json({ error: 'User course ID is required' }, { status: 400 });
    }

    // Get the user course and its purchase
    const userCourse = await db.userCourse.findUnique({
      where: { id: userCourseId },
      include: {
        purchase: true,
        course: true,
        user: true,
      },
    });

    if (!userCourse) {
      return NextResponse.json({ error: 'User course not found' }, { status: 404 });
    }

    if (!userCourse.purchase) {
      return NextResponse.json({ error: 'No purchase found for this course' }, { status: 404 });
    }

    // Verify user owns this purchase
    if (userCourse.user?.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent tampering: if client sent a subscriptionId, it must match DB
    if (subscriptionId && userCourse.purchase.subscriptionId && subscriptionId !== userCourse.purchase.subscriptionId) {
      return NextResponse.json({ error: 'Invalid subscriptionId' }, { status: 400 });
    }

    // Idempotency: already cancelled or scheduled
    if (userCourse.purchase.subscriptionStatus === 'canceled' || userCourse.purchase.subscriptionStatus === 'cancel_at_period_end') {
      return NextResponse.json({
        message: 'Subscription already cancelled or scheduled',
        success: true,
      });
    }

    // Cancel the Stripe subscription if it exists
    if (userCourse.purchase.subscriptionId) {
      try {
        await stripe.subscriptions.update(userCourse.purchase.subscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        return NextResponse.json(
          { error: 'Failed to update Stripe subscription' },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json({ error: 'No subscription found for this course' }, { status: 404 });
    }

    // Update the purchase record
    await db.userCoursePurchase.update({
      where: { id: userCourse.purchase.id },
      data: {
        subscriptionStatus: 'cancel_at_period_end',
        isRecurring: true,
      },
    });

    return NextResponse.json({ 
      message: 'Subscription will be cancelled at the end of the current billing period',
      success: true 
    });

  } catch (error) {
    console.error('Error cancelling course subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}