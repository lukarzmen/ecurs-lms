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
        
        // Użyj typu działalności z bazy danych użytkownika
        const businessType = user.businessType || 'individual';
        
        const accountData: any = {
            type: 'express',
            country: 'PL', // Poland
            email: email,
            business_type: businessType,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        };

        // Dla firm dodaj dodatkowe capabilities związane z fakturowaniem VAT
        if (businessType === 'company' && user.requiresVatInvoices) {
            accountData.capabilities.tax_reporting_us_1099_misc = { requested: true };
            accountData.capabilities.tax_reporting_us_1099_k = { requested: true };
        }

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
        
        // Create a detailed error response with proper JSON structure
        let errorMessage = "Failed to create Stripe Connect account";
        let errorDetails = {};
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
        
        // Log additional context for debugging
        console.error('Error details:', {
            message: errorMessage,
            userEmail: email,
            timestamp: new Date().toISOString(),
            ...errorDetails
        });
        
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
        
        // Always return JSON, never plain text
        return NextResponse.json(
            { 
                error: errorMessage,
                details: errorDetails,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
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
        
        const errorMessage = error instanceof Error ? error.message : "Failed to check Stripe Connect account";
        return NextResponse.json(
            { 
                error: errorMessage,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        console.log('PUT /api/stripe/connect - Starting force onboarding request');
        
        let requestBody;
        try {
            requestBody = await req.json();
            console.log('Request body:', requestBody);
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError);
            return NextResponse.json(
                { 
                    error: "Invalid JSON in request body",
                    timestamp: new Date().toISOString()
                }, 
                { status: 400 }
            );
        }
        
        const { forceOnboarding } = requestBody;
        
        if (!forceOnboarding) {
            console.error('forceOnboarding parameter is missing or false');
            return NextResponse.json(
                { 
                    error: "Invalid request - forceOnboarding parameter required",
                    timestamp: new Date().toISOString()
                }, 
                { status: 400 }
            );
        }

        console.log('PUT /api/stripe/connect - Getting current user from Clerk');
        let currentAuthUser;
        try {
            currentAuthUser = await currentUser();
            console.log('Clerk currentUser() call successful');
        } catch (clerkError) {
            console.error('Clerk authentication failed:', clerkError);
            throw new Error(`Clerk authentication failed: ${clerkError instanceof Error ? clerkError.message : 'Unknown Clerk error'}`);
        }
        
        console.log('Current user from Clerk:', currentAuthUser ? 'Found' : 'Not found');
        
        let email;
        try {
            email = currentAuthUser?.emailAddresses[0]?.emailAddress;
            console.log('Email extraction successful:', !!email);
        } catch (emailError) {
            console.error('Email extraction failed:', emailError);
            throw new Error(`Email extraction failed: ${emailError instanceof Error ? emailError.message : 'Unknown email error'}`);
        }
        
        if (!email) {
            console.error('User email not found in Clerk session');
            return NextResponse.json(
                { 
                    error: "User email not found",
                    timestamp: new Date().toISOString()
                }, 
                { status: 401 }
            );
        }

        console.log('Looking up user in database with email:', email);
        let user;
        try {
            user = await db.user.findUnique({
                where: { email: email },
                select: {
                    id: true,
                    email: true,
                    stripeAccountId: true,
                    stripeOnboardingComplete: true,
                    stripeAccountStatus: true
                }
            });
            console.log('Database query successful, user found:', !!user);
        } catch (dbError) {
            console.error('Database query failed:', dbError);
            throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
        }

        if (!user) {
            console.error('User not found in database:', email);
            return NextResponse.json(
                { 
                    error: "User not found in database",
                    timestamp: new Date().toISOString()
                }, 
                { status: 404 }
            );
        }

        if (!user.stripeAccountId) {
            console.error('User has no Stripe account ID:', email);
            return NextResponse.json(
                { 
                    error: "No Stripe account found for user",
                    timestamp: new Date().toISOString()
                }, 
                { status: 404 }
            );
        }

        console.log('User found with Stripe account:', user.stripeAccountId);

        // Create new onboarding link regardless of current status
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        console.log('Base URL from env:', baseUrl);
        
        if (!baseUrl) {
            console.error('NEXT_PUBLIC_APP_URL environment variable is missing');
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
        }
        
        let validBaseUrl: string;
        try {
            const url = new URL(baseUrl);
            validBaseUrl = url.origin;
            console.log('Valid base URL:', validBaseUrl);
        } catch (urlError) {
            console.error('Invalid URL format for NEXT_PUBLIC_APP_URL:', baseUrl, urlError);
            throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${baseUrl}`);
        }

        console.log('Creating Stripe account link for account:', user.stripeAccountId);
        let accountLink;
        try {
            accountLink = await stripe.accountLinks.create({
                account: user.stripeAccountId,
                refresh_url: `${validBaseUrl}/teacher/onboarding/refresh`,
                return_url: `${validBaseUrl}/teacher/onboarding/success`,
                type: 'account_onboarding',
            });
            console.log('Successfully created account link:', accountLink.url);
        } catch (stripeError) {
            console.error('Stripe API call failed:', stripeError);
            console.error('Stripe error type:', typeof stripeError);
            console.error('Stripe error details:', stripeError instanceof Error ? {
                message: stripeError.message,
                name: stripeError.name,
                stack: stripeError.stack
            } : stripeError);
            throw new Error(`Stripe API failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`);
        }

        return NextResponse.json({
            accountId: user.stripeAccountId,
            onboardingUrl: accountLink.url,
            onboardingComplete: false,
            accountStatus: 'pending_onboarding',
            forced: true
        });

    } catch (error) {
        console.error('=== FORCE ONBOARDING ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error instanceof Error:', error instanceof Error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error name:', error instanceof Error ? error.name : 'unknown');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Full error object:', error);
        console.error('=== END ERROR LOG ===');
        
        // Log request context for debugging
        console.error('Request context at time of error:');
        console.error('- NODE_ENV:', process.env.NODE_ENV);
        console.error('- NEXT_PUBLIC_APP_URL exists:', !!process.env.NEXT_PUBLIC_APP_URL);
        console.error('- STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
        
        const errorMessage = error instanceof Error ? error.message : "Failed to create onboarding link";
        return NextResponse.json(
            { 
                error: errorMessage,
                errorType: typeof error,
                details: error instanceof Error ? {
                    name: error.name,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                } : {},
                timestamp: new Date().toISOString(),
                context: 'PUT /api/stripe/connect forceOnboarding'
            }, 
            { status: 500 }
        );
    }
}