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
                        schoolType: true,
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

        let stripeAccountId = school.stripeAccountId;

        // If school doesn't have a Stripe account yet, create one
        if (!stripeAccountId) {
            // For localhost development, don't include business_profile URL as Stripe doesn't accept localhost
            const isLocalhost = validBaseUrl.includes('localhost') || validBaseUrl.includes('127.0.0.1');

            // Typ konta Stripe na podstawie typu szkoły:
            // - schoolType='individual' → Stripe 'individual' (jednoosobowa działalność, uproszczony proces)
            // - schoolType='business' → Stripe 'company' (sp. z o.o., fundacje, stowarzyszenia)
            // 
            // UWAGA: 'company' wymaga więcej dokumentów (KRS, umowa spółki, dane zarządu)
            // Jeśli szkoła chce uproszczonego procesu, może wybrać 'individual' podczas rejestracji
            const stripeBusinessType: 'individual' | 'company' = school.schoolType === 'business' ? 'company' : 'individual';
            
            const accountData: any = {
                type: 'express',
                country: 'PL', // Poland
                email: email,
                business_type: stripeBusinessType,
            };

            // Only add business_profile URL if not localhost
            if (!isLocalhost) {
                accountData.business_profile = {
                    url: validBaseUrl,
                };
            }

            const connectedAccount = await stripe.accounts.create(accountData);

            stripeAccountId = connectedAccount.id;

            // Update the school with the new Stripe account ID and status
            await db.school.update({
                where: { id: school.id },
                data: { 
                    stripeAccountId,
                    stripeAccountStatus: 'active'
                },
            });
        }

        // Create account link for onboarding/re-onboarding
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${validBaseUrl}/teacher/settings?refresh=true`,
            return_url: `${validBaseUrl}/teacher/settings?success=stripe`,
            type: 'account_onboarding',
            collect: 'eventually_due',
        });

        // Redirect to the account link URL
        return NextResponse.redirect(accountLink.url);

    } catch (error) {
        console.error('[STRIPE_CREATE_ACCOUNT_LINK]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
