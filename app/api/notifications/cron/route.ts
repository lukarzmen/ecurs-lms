import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/lib/notification-scheduler';

// POST /api/notifications/cron - Process scheduled notifications
export async function POST(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    // Support both Vercel Cron and manual triggers with CRON_SECRET
    const authHeader = req.headers.get('Authorization');
    const vercelCronHeader = req.headers.get('x-vercel-cron'); // Vercel adds this automatically
    const userAgent = req.headers.get('user-agent');
    const expectedSecret = process.env.CRON_SECRET;
    
    const isVercelCron = vercelCronHeader === '1' || userAgent?.includes('vercel-cron');
    const isAuthorizedManual = authHeader === `Bearer ${expectedSecret}`;
    
    if (!isVercelCron && !isAuthorizedManual) {
      console.log('[CRON_AUTH_FAILED]', {
        hasVercelCron: !!vercelCronHeader,
        hasAuth: !!authHeader,
        userAgent: userAgent?.substring(0, 50)
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const source = isVercelCron ? 'vercel-cron' : 'manual-trigger';
    console.log(`[CRON_TRIGGERED] Source: ${source}`);
    
    const result = await processScheduledNotifications();
    
    return NextResponse.json({
      success: true,
      message: 'Notification processing and module publication completed',
      source,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[NOTIFICATION_CRON_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications/cron - Check cron job status (for monitoring)
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Notification cron service is running',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[NOTIFICATION_CRON_STATUS_ERROR]', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}