import { db } from "@/lib/db";
import { Category, Module, Course, UserModule } from "@prisma/client"; // Added UserModule
import { NextResponse } from 'next/server';

// Type for data fetched from DB, including user progress
export type CourseWithProgress = Course & {
    modules: (Module & {
        userModules: UserModule[];
    })[];
    category: Category | null;
    author: {
        firstName: string | null;
        lastName: string | null;
        displayName?: string | null; // Add displayName as optional
    } | null;
}

// Type for the final structure of individual courses sent in the API response
export type CourseDetails = Omit<Course, 'userModules'> & {
    category: Category | null;
    modulesCount: number;
    isCompleted: boolean;
    nonFinishedModuleId: number | null; // ID of the last unfinished module, or last module if completed
        author: {
            firstName: string | null;
            lastName: string | null;
            displayName?: string | null; // Added displayName as optional
        } | null;
        enrolled?: boolean; // Optional field to indicate if the user is enrolled in the course
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
        console.log(`[getDashboardCourses] Found ${coursesWithProgress.length} courses for user ${user.id}`);

        return coursesWithProgress as CourseWithProgress[];
    } catch (error) {
        console.error("[getDashboardCourses] Error:", error);
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
        let nonFinishedModuleId: number | null = null; // Initialize nonFinishedModuleId

        if (totalModules === 0) {
            // If there are no modules, consider the course completed
            allModulesFinished = true;
            nonFinishedModuleId = null; // No modules to reference
        } else {
            // Check if every module is finished
            allModulesFinished = course.modules.every(module =>
                module.userModules.length > 0 && module.userModules[0].isFinished
            );

            if (allModulesFinished) {
                // If all finished, get the ID of the last module (highest position)
                nonFinishedModuleId = course.modules[course.modules.length - 1].id;
            } else {
                // If not all finished, find the *first* module that is *not* finished
                let firstUnfinished: Module | null = null;
                for (let i = 0; i < course.modules.length; i++) {
                    const courseModule = course.modules[i];
                    if (!(courseModule.userModules.length > 0 && courseModule.userModules[0].isFinished)) {
                        firstUnfinished = courseModule;
                        break; // Found the first unfinished one
                    }
                }
                nonFinishedModuleId = firstUnfinished ? firstUnfinished.id : null; // Assign its ID
            }
        }

        console.log(`[GET /user/courses] Course ID ${course.id}: Total Modules: ${totalModules}, All Finished: ${allModulesFinished}, Non-Finished/First Module ID: ${nonFinishedModuleId}`);

        // Prepare the detailed course object for the response
        const { modules, ...courseBaseData } = course;
        const courseDetail: CourseDetails = {
            ...courseBaseData,
            author: course.author
                ? {
                    displayName: course.author.displayName,
                    firstName: course.author.firstName,
                    lastName: course.author.lastName,
                }
                : null,
            category: course.category,
            modulesCount: totalModules,
            isCompleted: allModulesFinished,
            nonFinishedModuleId: nonFinishedModuleId,
            enrolled: false,
        };

        // Add to the main list and update counts
        allCoursesDetails.push(courseDetail);
        if (allModulesFinished) {
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