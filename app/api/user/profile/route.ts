import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        businessType: true,
        companyName: true,
        taxId: true,
        requiresVatInvoices: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      businessType,
      companyName,
      taxId,
      requiresVatInvoices,
    } = body;

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        displayName,
        businessType,
        companyName,
        taxId,
        requiresVatInvoices,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        businessType: true,
        companyName: true,
        taxId: true,
        requiresVatInvoices: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}