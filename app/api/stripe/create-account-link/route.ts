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
            where: { email: email },
            include: {
                ownedSchools: {
                    select: {
                        id: true,
                        stripeAccountId: true,
                    },
                    take: 1
                }
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if teacher has a school
        if (!user.ownedSchools || user.ownedSchools.length === 0) {
            return new NextResponse("School not found. Please contact admin.", { status: 400 });
        }

        const school = user.ownedSchools[0];

        // Check if school has a Stripe Connect account
        if (!school.stripeAccountId) {
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
            account: school.stripeAccountId,
            refresh_url: `${validBaseUrl}/teacher/settings?refresh=true`,
            return_url: `${validBaseUrl}/teacher/settings?success=stripe`,
            type: 'account_onboarding',
            collect: 'eventually_due',
        });

        // Return the account link URL
        return NextResponse.json({
            url: accountLink.url,
            schoolId: school.id,
        });

    } catch (error) {
        console.error('[STRIPE_CREATE_ACCOUNT_LINK]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
