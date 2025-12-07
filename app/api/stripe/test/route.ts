import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function GET() {
    try {
        console.log('=== Stripe Test Endpoint ===');
        
        // Check environment variables
        const requiredEnvVars = {
            STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
            NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
            DATABASE_URL: !!process.env.DATABASE_URL,
        };
        
        console.log('Environment variables check:', requiredEnvVars);
        
        // Check Clerk user
        const currentAuthUser = await currentUser();
        const userInfo = {
            hasUser: !!currentAuthUser,
            email: currentAuthUser?.emailAddresses[0]?.emailAddress,
            userId: currentAuthUser?.id
        };
        
        console.log('Clerk user info:', userInfo);
        
        // Check database connection
        let dbTestResult = 'unknown';
        try {
            await db.$queryRaw`SELECT 1`;
            dbTestResult = 'connected';
        } catch (dbError) {
            dbTestResult = `error: ${dbError instanceof Error ? dbError.message : 'unknown'}`;
        }
        
        console.log('Database test:', dbTestResult);
        
        // Check Stripe connection
        let stripeTestResult = 'unknown';
        try {
            await stripe.accounts.list({ limit: 1 });
            stripeTestResult = 'connected';
        } catch (stripeError) {
            stripeTestResult = `error: ${stripeError instanceof Error ? stripeError.message : 'unknown'}`;
        }
        
        console.log('Stripe test:', stripeTestResult);
        
        // If user exists, check database record
        let userDbRecord = null;
        if (userInfo.email) {
            try {
                userDbRecord = await db.user.findUnique({
                    where: { email: userInfo.email },
                    select: {
                        id: true,
                        email: true,
                        ownedSchools: {
                            select: {
                                id: true,
                                stripeAccountId: true,
                                stripeOnboardingComplete: true,
                                stripeAccountStatus: true
                            }
                        }
                    }
                });
            } catch (userError) {
                userDbRecord = { error: userError instanceof Error ? userError.message : 'unknown' };
            }
        }
        
        console.log('User database record:', userDbRecord);
        
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            environment: {
                variables: requiredEnvVars,
                appUrl: process.env.NEXT_PUBLIC_APP_URL
            },
            clerk: userInfo,
            database: {
                status: dbTestResult,
                userRecord: userDbRecord
            },
            stripe: {
                status: stripeTestResult
            }
        });
        
    } catch (error) {
        console.error('Test endpoint error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}