import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
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
        educationalPath: true,
        user: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Educational path purchase not found' }, { status: 404 });
    }

    // Cancel the Stripe subscription if it exists
    if (purchase.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(purchase.subscriptionId);
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