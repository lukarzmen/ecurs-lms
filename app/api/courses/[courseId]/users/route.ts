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
    authorId: number; // Course Author ID
}

export async function GET(req: Request, { params }: { params: { courseId: string } }): Promise<NextResponse<UserCourseResponse[] | string>> {
    try {
        const { courseId } = params;
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
                user: { // Include related User data
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                    }
                },
                role: { // Include related Role data
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
        });

        if (!userCourses) {
            return new NextResponse("No users found for this course", { status: 404 });
        }

        const usersResponse: UserCourseResponse[] = userCourses.map(uc => ({
            id: uc.user.id,
            name: uc.user.displayName,
            email: uc.user.email,
            userCourseId: uc.id,
            state: uc.state,
            roleName: uc.role?.name || "No Role", // Use optional chaining and provide default
            roleId: uc.role?.id || 0, // Use optional chaining and provide default
            authorId: course.authorId, // Add authorId from the fetched course
        }));

        return NextResponse.json(usersResponse);
    } catch (error) {
        console.log("[COURSE_ID_USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
