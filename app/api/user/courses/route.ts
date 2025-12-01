import { db } from "@/lib/db";
import { Category, Module, Course, UserModule } from "@prisma/client"; // Added UserModule
import { NextResponse } from 'next/server';

// Type for data fetched from DB, including user progress
export type CourseWithProgress = Course & {
    modules: (Module & {
        userModules: UserModule[];
    })[];
    category: Category | null;
    school: { name: string } | null;
    author: {
        firstName: string | null;
        lastName: string | null;
        displayName?: string | null;
    } | null;
}

// Type for the final structure of individual courses sent in the API response
export type CourseDetails = Omit<Course, 'userModules'> & {
    category: Category | null;
    school: { name: string } | null;
    modulesCount: number;
    isCompleted: boolean;
    author: {
        firstName: string | null;
        lastName: string | null;
        displayName?: string | null;
    } | null;
    enrolled?: boolean;
    type: "course" | "educationalPath" | null;
};

// Type for the final API response structure, including counts
export type DashboardCoursesResponse = {
    courses: CourseDetails[];
    finishedCount: number;
    unfinishedCount: number;
} | { error: string };


const getDashboardCourses = async (userId: string): Promise<CourseWithProgress[]> => {
    try {
        const user = await db.user.findUnique({
            where: {
                providerId: userId,
            },
        });

        if (!user) {
            console.log(`[getDashboardCourses] User not found for providerId: ${userId}`);
            return [];
        }
        console.log(`[getDashboardCourses] Found user: ${user.id}`);

        const coursesWithProgress = await db.course.findMany({
            where: {
                userCourses: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                category: true,
                school: { select: { name: true } },
                modules: {
                    orderBy: {
                        position: 'asc'
                    },
                    include: {
                        userModules: {
                            where: {
                                userId: user.id
                            }
                        }
                    }
                },
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        displayName: true, // Select displayName
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log(`Found ${coursesWithProgress.length} courses for user ${user.id}`);

        return coursesWithProgress as CourseWithProgress[];
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

export async function GET(req: Request): Promise<NextResponse<DashboardCoursesResponse>> {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') as string;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const courses = await getDashboardCourses(userId);

    const allCoursesDetails: CourseDetails[] = [];
    let finishedCount = 0;
    let unfinishedCount = 0;

    // Process and categorize courses
    courses.forEach((course: CourseWithProgress) => {
        const totalModules = course.modules.length;
        let allModulesFinished = false;
        const state = course.state;
        if (totalModules === 0) {
            // If there are no modules, consider the course completed
            allModulesFinished = true;
        } else {
            // Check if every module is finished
            allModulesFinished = course.modules.every(module =>
                module.userModules.length > 0 && module.userModules[0].isFinished
            );
        }

        // Prepare the detailed course object for the response
        const { modules, ...courseBaseData } = course;
        const closeCourseCompleted = allModulesFinished && state === 1;
        const courseDetail: CourseDetails = {
            ...courseBaseData,
            author: course.author
                ? {
                    displayName: course.author.displayName,
                    firstName: course.author.firstName,
                    lastName: course.author.lastName,
                }
                : null,
            school: course.school,
            category: course.category,
            type: "course",
            modulesCount: totalModules,
            isCompleted: closeCourseCompleted,
            enrolled: false,
        };

        // Add to the main list and update counts
        allCoursesDetails.push(courseDetail);
        if (closeCourseCompleted) {
            finishedCount++;
        } else {
            unfinishedCount++;
        }
    });

    // Return the single list and the counts
    return NextResponse.json({
        courses: allCoursesDetails,
        finishedCount: finishedCount,
        unfinishedCount: unfinishedCount
}, { status: 200 });
}