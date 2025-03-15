import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET() {
    const userCount = await db.user.count();
    const coursesCount = await db.course.count();
    const modulesCount = await db.module.count();

    return NextResponse.json({ userCount, coursesCount, modulesCount });
}