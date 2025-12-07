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
            where: { email: email },
            include: {
                ownedSchools: {
                    take: 1
                }
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // If user is a teacher (roleId === 1), update their school instead of user
        if (user.roleId === 1 && user.ownedSchools && user.ownedSchools.length > 0) {
            const school = user.ownedSchools[0];
            
            const updatedSchool = await db.school.update({
                where: { id: school.id },
                data: {
                    companyName: businessType === 'company' ? companyName : null,
                    taxId: businessType === 'company' ? taxId : null,
                    requiresVatInvoices: requiresVatInvoices || false,
                    updatedAt: new Date(),
                }
            });

            return NextResponse.json({
                success: true,
                businessType: businessType,
                companyName: updatedSchool.companyName,
                taxId: updatedSchool.taxId,
                requiresVatInvoices: updatedSchool.requiresVatInvoices,
                updatedAt: updatedSchool.updatedAt,
            });
        }

        // For non-teachers, this endpoint is not applicable
        return new NextResponse("Only teachers can update business type through their school", { status: 403 });

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
            include: {
                ownedSchools: {
                    select: {
                        id: true,
                        companyName: true,
                        taxId: true,
                    },
                    take: 1
                }
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // If teacher, return school business data
        if (user.roleId === 1 && user.ownedSchools && user.ownedSchools.length > 0) {
            const school = user.ownedSchools[0];
            return NextResponse.json({
                businessType: school.companyName ? 'company' : 'individual',
                companyName: school.companyName,
                taxId: school.taxId,
                school_id: school.id,
            });
        }

        // For non-teachers, return default
        return NextResponse.json({
            businessType: 'individual',
            companyName: null,
            taxId: null,
        });
    } catch (error) {
        console.error('Business type GET error:', error);
        return new NextResponse("Failed to fetch business type", { status: 500 });
    }
}