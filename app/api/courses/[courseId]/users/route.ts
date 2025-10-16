import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export interface UserCourseResponse {
    id: number; // User ID
    name: string | null;
    email: string | null;
    userCourseId: number; // UserCourse ID
    state: number;
    roleName: string;
    roleId: number;
    progress: number; // User's progress in the course (0.0 to 1.0)
    authorId: number; // Course Author ID
}

export async function GET(req: Request, context: { params: Promise<{ courseId: string }> }): Promise<NextResponse<UserCourseResponse[] | string>> {
    try {
        const params = await context.params;
        const courseId = params.courseId;
        const courseIdNumber = Number(courseId);

        if (isNaN(courseIdNumber)) {
            return new NextResponse("Invalid Course ID", { status: 400 });
        }

        // Fetch the course to get the authorId
        const course = await db.course.findUnique({
            where: { id: courseIdNumber },
            select: { authorId: true }
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        const userCourses = await db.userCourse.findMany({
            where: {
                courseId: courseIdNumber,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                    }
                },
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });

        if (userCourses.length === 0) {
            return NextResponse.json([]);
        }

        // Fetch all modules for the course to get the total count
        const courseModules = await db.module.findMany({
            where: { courseId: courseIdNumber },
            select: { id: true }
        });
        const totalModulesCount = courseModules.length;
        const courseModuleIds = courseModules.map(m => m.id);

        const userIdsInCourse = userCourses.map(uc => uc.userId);
        const finishedModulesCountMap = new Map<number, number>();

        if (totalModulesCount > 0 && userIdsInCourse.length > 0 && courseModuleIds.length > 0) {
            const finishedCountsPerUser = await db.userModule.groupBy({
                by: ['userId'],
                where: {
                    userId: { in: userIdsInCourse },
                    moduleId: { in: courseModuleIds },
                    isFinished: true
                },
                _count: {
                    id: true // Counting the number of finished UserModule records
                }
            });

            finishedCountsPerUser.forEach(item => {
                finishedModulesCountMap.set(item.userId, item._count.id);
            });
        }

        const usersResponse: UserCourseResponse[] = userCourses.map(uc => {
            const finishedUserModulesCount = finishedModulesCountMap.get(uc.userId) || 0;
            const progress = totalModulesCount > 0 
                ? parseFloat((finishedUserModulesCount / totalModulesCount).toFixed(2)) // Calculate progress, format to 2 decimal places
                : 0;

            return {
                id: uc.user.id,
                name: uc.user.displayName,
                email: uc.user.email,
                userCourseId: uc.id,
                state: uc.state,
                roleName: uc.role?.name || "No Role",
                roleId: uc.role?.id || 0,
                authorId: course.authorId,
                progress: progress,
            };
        });

        return NextResponse.json(usersResponse);
    } catch (error) {
        console.error("[COURSE_ID_USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request, context: { params: Promise<{ courseId: string }> }) {
    try {
        const params = await context.params;
        const { courseId } = params;
        const courseIdNumber = Number(courseId);

        if (isNaN(courseIdNumber)) {
            return new NextResponse("Invalid Course ID", { status: 400 });
        }

        const body = await req.json();
        // Accept either a single userId or an array of userIds
        let userIds: number[] = [];

        if (Array.isArray(body.userId)) {
            userIds = body.userId.map(Number);
        } else if (Array.isArray(body.userIds)) {
            userIds = body.userIds.map(Number);
        } else if (typeof body.userId === "number" || typeof body.userId === "string") {
            userIds = [Number(body.userId)];
        } else {
            return new NextResponse("Missing userId(s)", { status: 400 });
        }

        const created: number[] = [];
        const skipped: number[] = [];

        for (const uid of userIds) {
            // Check if userCourse already exists
            const existing = await db.userCourse.findUnique({
                where: {
                    userId_courseId: {
                        userId: uid,
                        courseId: courseIdNumber,
                    }
                }
            });

            if (existing) {
                skipped.push(uid);
                continue;
            }

            await db.userCourse.create({
                data: {
                    userId: uid,
                    courseId: courseIdNumber,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    roleId: 0,
                    state: 1,
                }
            });
            created.push(uid);
        }

        return NextResponse.json({
            created,
            skipped,
            message: `Added ${created.length} user(s), skipped ${skipped.length} (already enrolled)`
        });
    } catch (error) {
        console.error("[COURSE_ID_USERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
