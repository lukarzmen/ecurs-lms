import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userCourseId: string }> }
) {
  try {
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

    // Cancel the Stripe subscription if it exists
    if (userCourse.purchase.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(userCourse.purchase.subscriptionId);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update the purchase record
    await db.userCoursePurchase.update({
      where: { id: userCourse.purchase.id },
      data: {
        subscriptionStatus: 'canceled',
        isRecurring: false,
      },
    });

    return NextResponse.json({ 
      message: 'Subscription cancelled successfully',
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