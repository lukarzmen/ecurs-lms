import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function PUT(req: Request) {
    try {
        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const { businessType, companyName, taxId, requiresVatInvoices } = await req.json();

        // Walidacja danych wejściowych
        if (!businessType || !['individual', 'company'].includes(businessType)) {
            return new NextResponse("Invalid business type", { status: 400 });
        }

        if (businessType === 'company' && (!companyName || !taxId)) {
            return new NextResponse("Company name and tax ID are required for company type", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Aktualizuj dane użytkownika
        const updatedUser = await db.user.update({
            where: { email: email },
            data: {
                businessType: businessType,
                companyName: businessType === 'company' ? companyName : null,
                taxId: businessType === 'company' ? taxId : null,
                requiresVatInvoices: businessType === 'company' ? requiresVatInvoices : false,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({
            success: true,
            businessType: updatedUser.businessType,
            companyName: updatedUser.companyName,
            taxId: updatedUser.taxId,
            requiresVatInvoices: updatedUser.requiresVatInvoices,
        });

    } catch (error) {
        console.error('Business type update error:', error);
        return new NextResponse("Failed to update business type", { status: 500 });
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
            where: { email: email },
            select: {
                businessType: true,
                companyName: true,
                taxId: true,
                requiresVatInvoices: true,
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Get business type error:', error);
        return new NextResponse("Failed to get business type", { status: 500 });
    }
}