import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const students = await db.user.findMany({
            orderBy: {
                id: 'asc',
            },
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error('[GET_STUDENTS]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}