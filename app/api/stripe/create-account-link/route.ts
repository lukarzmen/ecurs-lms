import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    try {
        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user has a Stripe Connect account
        if (!user.stripeAccountId) {
            return new NextResponse("Stripe account not found. Please complete registration first.", { status: 400 });
        }

        // Get the base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for Stripe Connect onboarding links');
        }
        
        let validBaseUrl: string;
        try {
            const url = new URL(baseUrl);
            validBaseUrl = url.origin;
        } catch {
            throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${baseUrl}`);
        }

        // Create account link for onboarding/re-onboarding
        const accountLink = await stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: `${validBaseUrl}/teacher/settings?refresh=true`,
            return_url: `${validBaseUrl}/teacher/settings?success=stripe`,
            type: 'account_onboarding',
            collect: 'eventually_due',
        });

        // Update user's status to indicate ongoing onboarding
        await db.user.update({
            where: { email: email },
            data: {
                stripeAccountStatus: 'pending_onboarding',
                updatedAt: new Date(),
            }
        });

        // Redirect to Stripe onboarding
        return NextResponse.redirect(accountLink.url);

    } catch (error) {
        console.error('[STRIPE_CREATE_ACCOUNT_LINK]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
