import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    try {
        const userId = searchParams.get("userId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { providerId: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user belongs to a school
        const schoolTeacher = await db.schoolTeacher.findFirst({
            where: { teacherId: user.id },
            select: { schoolId: true },
        });

        let userCourses;

        if (schoolTeacher) {
            // User is part of a school - get all students from school courses
            console.log("Fetching students for school:", schoolTeacher.schoolId);
            
            // Get all school teachers
            const schoolTeachers = await db.schoolTeacher.findMany({
                where: { schoolId: schoolTeacher.schoolId },
                select: { teacherId: true },
            });
            const teacherIds = schoolTeachers.map(st => st.teacherId);
            
            // Get all courses for the school
            const schoolCourses = await db.course.findMany({
                where: {
                    OR: [
                        { schoolId: schoolTeacher.schoolId },
                        { authorId: { in: teacherIds } }
                    ]
                },
                select: { id: true },
            });
            const schoolCourseIds = schoolCourses.map(c => c.id);
            
            // Get all students enrolled in school courses
            userCourses = await db.userCourse.findMany({
                where: {
                    courseId: { in: schoolCourseIds }
                },
                include: {
                    user: true
                }
            });
            console.log("Found", userCourses.length, "student enrollments in school courses");
        } else {
            // User is not part of a school - get students from their own courses
            console.log("User not in school, fetching students from own courses");
            
            userCourses = await db.userCourse.findMany({
                where: {
                    courseId: {
                        in: await db.userCourse.findMany({
                            where: {
                                userId: user.id
                            },
                            select: {
                                courseId: true
                            }
                        }).then(userCourses => userCourses.map(userCourse => userCourse.courseId))
                    }
                },
                include: {
                    user: true
                }
            });
        }

        // Extract unique users from userCourses
        const uniqueUsers = Array.from(
            new Map(userCourses.map(userCourse => [userCourse.user.id, userCourse.user])).values()
        ).sort((a, b) => a.firstName?.localeCompare(b.firstName || "") || 0);

        console.log("Returning", uniqueUsers.length, "unique students");
        return NextResponse.json(uniqueUsers);
    } catch (error) {
        console.error('[GET_STUDENTS]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}