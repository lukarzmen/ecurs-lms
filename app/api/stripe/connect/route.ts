import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    const currentAuthUser = await currentUser();
    const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
    
    if (!email) {
        return new NextResponse("User email not found", { status: 401 });
    }

    try {

        const user = await db.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user already has a Stripe Connect account
        if (user.stripeAccountId) {
            // Get existing account details
            const account = await stripe.accounts.retrieve(user.stripeAccountId);
            
            // If onboarding is not complete, allow re-onboarding
            if (!user.stripeOnboardingComplete || !account.charges_enabled || !account.payouts_enabled) {
                // Create new account link for re-onboarding
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

                const accountLink = await stripe.accountLinks.create({
                    account: user.stripeAccountId,
                    refresh_url: `${validBaseUrl}/teacher/onboarding/refresh`,
                    return_url: `${validBaseUrl}/teacher/onboarding/success`,
                    type: 'account_onboarding',
                });

                // Update user's status to indicate re-onboarding
                await db.user.update({
                    where: { email: email },
                    data: {
                        stripeAccountStatus: 'pending_onboarding',
                        stripeOnboardingComplete: false,
                        updatedAt: new Date(),
                    }
                });

                return NextResponse.json({
                    accountId: user.stripeAccountId,
                    onboardingUrl: accountLink.url,
                    onboardingComplete: false,
                    accountStatus: 'pending_onboarding',
                    existingAccount: true,
                    requiresOnboarding: true
                });
            }
            
            // Account is complete, return existing details
            return NextResponse.json({
                accountId: user.stripeAccountId,
                onboardingComplete: user.stripeOnboardingComplete,
                accountStatus: user.stripeAccountStatus,
                existingAccount: true,
                details: account
            });
        }

        // Create new Stripe Connect account
        const businessUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        if (!businessUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for Stripe Connect account creation');
        }
        
        // For localhost development, don't include business_profile URL as Stripe doesn't accept localhost
        const isLocalhost = businessUrl.includes('localhost') || businessUrl.includes('127.0.0.1');
        
        const accountData: any = {
            type: 'express',
            country: 'PL', // Poland
            email: email,
            business_type: 'individual',
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        };

        // Only add business_profile with URL for production (non-localhost) environments
        if (!isLocalhost) {
            // Validate URL format for production
            try {
                new URL(businessUrl);
                accountData.business_profile = {
                    url: businessUrl,
                    mcc: '5815', // Digital goods/services
                };
            } catch {
                throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${businessUrl}`);
            }
        } else {
            // For localhost, just set the MCC code without URL
            accountData.business_profile = {
                mcc: '5815', // Digital goods/services
            };
        }

        const account = await stripe.accounts.create(accountData);

        // Update user with Stripe account ID
        await db.user.update({
            where: { email: email },
            data: {
                stripeAccountId: account.id,
                stripeAccountStatus: 'created',
                stripeOnboardingComplete: false,
                updatedAt: new Date(),
            }
        });

        // Create account link for onboarding
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for Stripe Connect onboarding links');
        }
        
        // Ensure URL has proper format
        let validBaseUrl: string;
        try {
            const url = new URL(baseUrl);
            validBaseUrl = url.origin;
        } catch {
            throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${baseUrl}`);
        }

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${validBaseUrl}/teacher/onboarding/refresh`,
            return_url: `${validBaseUrl}/teacher/onboarding/success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            accountId: account.id,
            onboardingUrl: accountLink.url,
            onboardingComplete: false,
            accountStatus: 'created',
            existingAccount: false,
            requiresOnboarding: true
        });

    } catch (error) {
        console.error('Stripe Connect account creation error:', error);
        
        // If we created a Stripe account but failed to update user, still try to provide the onboarding URL
        // This prevents users from getting stuck in registration
        if (error instanceof Error && error.message.includes('account')) {
            // Try to get the account that might have been created
            try {
                const accounts = await stripe.accounts.list({ 
                    limit: 10,
                });
                
                const recentAccount = accounts.data.find(acc => acc.email === email);
                
                if (recentAccount) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
                    if (baseUrl) {
                        const validBaseUrl = new URL(baseUrl).origin;
                        const accountLink = await stripe.accountLinks.create({
                            account: recentAccount.id,
                            refresh_url: `${validBaseUrl}/teacher/onboarding/refresh`,
                            return_url: `${validBaseUrl}/teacher/onboarding/success`,
                            type: 'account_onboarding',
                        });
                        
                        return NextResponse.json({
                            accountId: recentAccount.id,
                            onboardingUrl: accountLink.url,
                            onboardingComplete: false,
                            accountStatus: 'created',
                            existingAccount: false,
                            requiresOnboarding: true,
                            recovered: true
                        });
                    }
                }
            } catch (recoveryError) {
                console.error('Recovery attempt failed:', recoveryError);
            }
        }
        
        return new NextResponse("Failed to create Stripe Connect account", { status: 500 });
    }
}

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

        if (!user || !user.stripeAccountId) {
            return NextResponse.json({
                hasAccount: false,
                onboardingComplete: false
            });
        }

        // Check account status
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        const isComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;

        // Update user's onboarding status if it has changed
        if (isComplete !== user.stripeOnboardingComplete) {
            await db.user.update({
                where: { id: user.id },
                data: {
                    stripeOnboardingComplete: isComplete,
                    stripeAccountStatus: isComplete ? 'active' : 'pending',
                    updatedAt: new Date(),
                }
            });
        }

        return NextResponse.json({
            hasAccount: true,
            accountId: user.stripeAccountId,
            onboardingComplete: isComplete,
            accountStatus: isComplete ? 'active' : 'pending',
            details: account
        });

    } catch (error) {
        console.error('Stripe Connect account check error:', error);
        return new NextResponse("Failed to check Stripe Connect account", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { forceOnboarding } = await req.json();
        
        if (!forceOnboarding) {
            return new NextResponse("Invalid request", { status: 400 });
        }

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email }
        });

        if (!user || !user.stripeAccountId) {
            return new NextResponse("No Stripe account found", { status: 404 });
        }

        // Create new onboarding link regardless of current status
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
        }
        
        let validBaseUrl: string;
        try {
            const url = new URL(baseUrl);
            validBaseUrl = url.origin;
        } catch {
            throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${baseUrl}`);
        }

        const accountLink = await stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: `${validBaseUrl}/teacher/onboarding/refresh`,
            return_url: `${validBaseUrl}/teacher/onboarding/success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            accountId: user.stripeAccountId,
            onboardingUrl: accountLink.url,
            onboardingComplete: false,
            accountStatus: 'pending_onboarding',
            forced: true
        });

    } catch (error) {
        console.error('Force onboarding error:', error);
        return new NextResponse("Failed to create onboarding link", { status: 500 });
    }
}