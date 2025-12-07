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

    // Cancel the Stripe subscription if it exists
    if (purchase.subscriptionId) {
      try {
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
          apiVersion: "2025-05-28.basil",
        });

        // Determine which Stripe account to use
        const schoolStripeAccountId = purchase.educationalPath.school?.stripeAccountId;
        
        if (schoolStripeAccountId) {
          // Cancel on school's Connect account
          await stripeClient.subscriptions.cancel(purchase.subscriptionId, {}, {
            stripeAccount: schoolStripeAccountId
          });
          console.log(`Cancelled subscription ${purchase.subscriptionId} on school Connect account ${schoolStripeAccountId}`);
        } else {
          // Cancel on platform account
          await stripeClient.subscriptions.cancel(purchase.subscriptionId);
          console.log(`Cancelled subscription ${purchase.subscriptionId} on platform account`);
        }
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update the purchase record
    await db.educationalPathPurchase.update({
      where: { id: purchaseId },
      data: {
        subscriptionStatus: 'canceled',
        isRecurring: false,
      },
    });

    return NextResponse.json({ 
      message: 'Educational path subscription cancelled successfully',
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