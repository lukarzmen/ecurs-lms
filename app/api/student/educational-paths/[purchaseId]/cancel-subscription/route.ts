import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await request.json();
    const resolvedParams = await params;
    const purchaseId = parseInt(resolvedParams.purchaseId);

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    // Get the educational path purchase
    const purchase = await db.educationalPathPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        educationalPath: {
          include: {
            school: {
              select: {
                id: true,
                stripeAccountId: true,
              }
            }
          }
        },
        user: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Educational path purchase not found' }, { status: 404 });
    }

    // Verify user owns this purchase
    if (purchase.user.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent tampering: if client sent a subscriptionId, it must match DB
    if (subscriptionId && purchase.subscriptionId && subscriptionId !== purchase.subscriptionId) {
      return NextResponse.json({ error: 'Invalid subscriptionId' }, { status: 400 });
    }

    // Idempotency: already cancelled or scheduled
    if (purchase.subscriptionStatus === 'canceled' || purchase.subscriptionStatus === 'cancel_at_period_end') {
      return NextResponse.json({
        message: 'Educational path subscription already cancelled or scheduled',
        success: true,
      });
    }

    // Cancel the Stripe subscription if it exists
    if (purchase.subscriptionId) {
      try {
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
          apiVersion: "2025-05-28.basil",
        });

        // Determine which Stripe account to use
        const schoolStripeAccountId = purchase.educationalPath.school?.stripeAccountId;
        
        if (schoolStripeAccountId) {
          // Cancel at period end on school's Connect account
          await stripeClient.subscriptions.update(
            purchase.subscriptionId,
            { cancel_at_period_end: true },
            { stripeAccount: schoolStripeAccountId }
          );
          console.log(`Scheduled cancellation for subscription ${purchase.subscriptionId} on school Connect account ${schoolStripeAccountId}`);
        } else {
          // Cancel at period end on platform account
          await stripeClient.subscriptions.update(purchase.subscriptionId, {
            cancel_at_period_end: true,
          });
          console.log(`Scheduled cancellation for subscription ${purchase.subscriptionId} on platform account`);
        }
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        return NextResponse.json(
          { error: 'Failed to update Stripe subscription' },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json({ error: 'No subscription found for this purchase' }, { status: 404 });
    }

    // Update the purchase record
    await db.educationalPathPurchase.update({
      where: { id: purchaseId },
      data: {
        subscriptionStatus: 'cancel_at_period_end',
        isRecurring: true,
      },
    });

    return NextResponse.json({ 
      message: 'Educational path subscription will be cancelled at the end of the current billing period',
      success: true 
    });

  } catch (error) {
    console.error('Error cancelling educational path subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}