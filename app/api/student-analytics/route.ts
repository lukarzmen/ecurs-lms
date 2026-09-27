import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");
    
    try {
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { providerId: userId },
            select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Get all courses the user is enrolled in
        const userCourses = await db.userCourse.findMany({
            where: { userId: user.id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        modules: {
                            select: {
                                id: true,
                                title: true,
                                position: true,
                            },
                            orderBy: { position: 'asc' }
                        }
                    }
                }
            }
        });

        const enrolledCoursesCount = userCourses.length;

        // Get user's module progress
        const userModules = await db.userModule.findMany({
            where: { userId: user.id },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        course: {
                            select: { title: true }
                        }
                    }
                }
            }
        });

        const totalModules = userModules.length;
        const completedModules = userModules.filter(um => um.isFinished).length;
        const inProgressModules = userModules.filter(um => um.isOpen && !um.isFinished).length;
        const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        // Calculate completed courses (all modules completed)
        const completedCourses = [];
        for (const userCourse of userCourses) {
            const courseModuleIds = userCourse.course.modules.map(m => m.id);
            const completedCourseModules = userModules.filter(um => 
                courseModuleIds.includes(um.module.id) && um.isFinished
            );
            
            if (courseModuleIds.length > 0 && completedCourseModules.length === courseModuleIds.length) {
                completedCourses.push({
                    id: userCourse.course.id,
                    title: userCourse.course.title,
                    completedDate: Math.max(...completedCourseModules.map(cm => cm.updatedAt.getTime()))
                });
            }
        }

        const completedCoursesCount = completedCourses.length;

        // Calculate learning streak (consecutive days with activity)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toDateString();
        });

        const recentActivity = await db.userModule.findMany({
            where: {
                userId: user.id,
                updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            },
            select: {
                updatedAt: true,
                isFinished: true
            }
        });

        const activityDays = new Set(
            recentActivity.map(activity => activity.updatedAt.toDateString())
        );

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toDateString();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - i);
            if (activityDays.has(checkDate.toDateString())) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Get recent completed modules for timeline
        const recentCompletions = await db.userModule.findMany({
            where: {
                userId: user.id,
                isFinished: true,
                updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            include: {
                module: {
                    select: {
                        title: true,
                        course: {
                            select: { title: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });

        // Course progress details
        const courseProgress = userCourses.map(userCourse => {
            const courseModuleIds = userCourse.course.modules.map(m => m.id);
            const courseUserModules = userModules.filter(um => 
                courseModuleIds.includes(um.module.id)
            );
            
            const totalCourseModules = courseModuleIds.length;
            const completedCourseModules = courseUserModules.filter(um => um.isFinished).length;
            const progressPercentage = totalCourseModules > 0 ? 
                Math.round((completedCourseModules / totalCourseModules) * 100) : 0;

            const nextModule = userCourse.course.modules.find(module => {
                const userModule = courseUserModules.find(um => um.module.id === module.id);
                return !userModule || !userModule.isFinished;
            });

            return {
                id: userCourse.course.id,
                title: userCourse.course.title,
                description: userCourse.course.description,
                totalModules: totalCourseModules,
                completedModules: completedCourseModules,
                progressPercentage,
                nextModule: nextModule ? {
                    id: nextModule.id,
                    title: nextModule.title,
                    position: nextModule.position
                } : null,
                isCompleted: completedCourseModules === totalCourseModules && totalCourseModules > 0,
                enrolledAt: userCourse.createdAt
            };
        });

        // Calculate time spent learning (approximation based on activity)
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const thisWeekActivity = await db.userModule.count({
            where: {
                userId: user.id,
                updatedAt: { gte: thisWeekStart },
                isFinished: true
            }
        });

        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const thisMonthActivity = await db.userModule.count({
            where: {
                userId: user.id,
                updatedAt: { gte: thisMonthStart },
                isFinished: true
            }
        });

        // Get educational paths progress
        const userEducationalPaths = await db.userEducationalPath.findMany({
            where: { userId: user.id },
            include: {
                educationalPath: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        courses: {
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                        modules: {
                                            select: { id: true }
                                        }
                                    }
                                }
                            },
                            orderBy: { position: 'asc' }
                        }
                    }
                }
            }
        });

        const pathProgress = userEducationalPaths.map(userPath => {
            const pathCourses = userPath.educationalPath.courses;
            let totalPathModules = 0;
            let completedPathModules = 0;

            pathCourses.forEach(pathCourse => {
                const courseModules = pathCourse.course.modules;
                totalPathModules += courseModules.length;
                
                courseModules.forEach(module => {
                    const userModule = userModules.find(um => um.module.id === module.id);
                    if (userModule && userModule.isFinished) {
                        completedPathModules++;
                    }
                });
            });

            const progressPercentage = totalPathModules > 0 ? 
                Math.round((completedPathModules / totalPathModules) * 100) : 0;

            return {
                id: userPath.educationalPath.id,
                title: userPath.educationalPath.title,
                description: userPath.educationalPath.description,
                totalCourses: pathCourses.length,
                totalModules: totalPathModules,
                completedModules: completedPathModules,
                progressPercentage,
                isCompleted: userPath.state === 2,
                enrolledAt: userPath.createdAt
            };
        });

        // Achievements calculation
        const achievements = [];
        
        // First completion achievement
        if (completedModules > 0) {
            achievements.push({
                id: 'first_completion',
                title: 'Pierwszy krok',
                description: 'Ukończyłeś swój pierwszy moduł!',
                icon: '🎯',
                unlockedAt: recentCompletions[0]?.updatedAt || new Date(),
                category: 'progress'
            });
        }

        // Course completion achievements
        if (completedCoursesCount >= 1) {
            achievements.push({
                id: 'first_course',
                title: 'Pierwszy kurs ukończony',
                description: 'Gratulacje! Ukończyłeś swój pierwszy kurs.',
                icon: '🏆',
                unlockedAt: new Date(Math.min(...completedCourses.map(c => c.completedDate))),
                category: 'completion'
            });
        }

        if (completedCoursesCount >= 3) {
            achievements.push({
                id: 'three_courses',
                title: 'Potrójny sukces',
                description: 'Ukończyłeś już 3 kursy!',
                icon: '🌟',
                unlockedAt: new Date(),
                category: 'completion'
            });
        }

        // Streak achievements
        if (currentStreak >= 3) {
            achievements.push({
                id: 'streak_3',
                title: 'Konsekwentny uczeń',
                description: `${currentStreak} dni z rzędu uczysz się!`,
                icon: '🔥',
                unlockedAt: new Date(),
                category: 'streak'
            });
        }

        if (currentStreak >= 7) {
            achievements.push({
                id: 'streak_7',
                title: 'Mistrz regularności',
                description: 'Tydzień ciągłej nauki - imponujące!',
                icon: '💪',
                unlockedAt: new Date(),
                category: 'streak'
            });
        }

        // Progress achievements
        if (overallProgress >= 25) {
            achievements.push({
                id: 'progress_25',
                title: 'Ćwierć drogi',
                description: '25% ogólnego postępu osiągnięte!',
                icon: '📈',
                unlockedAt: new Date(),
                category: 'progress'
            });
        }

        if (overallProgress >= 50) {
            achievements.push({
                id: 'progress_50',
                title: 'W połowie drogi',
                description: 'Połowa materiału za Tobą!',
                icon: '🚀',
                unlockedAt: new Date(),
                category: 'progress'
            });
        }

        // Streak-at-risk: user has an active streak but hasn't studied yet today - nudge to keep it alive
        const streakAtRisk = currentStreak > 0 && !activityDays.has(today);

        // "Continue learning" call to action - first not-yet-completed course with a known next module
        const nextBestAction = courseProgress.find(cp => !cp.isCompleted && cp.nextModule) ?? null;

        // Weekly learning goal - encourages a steady habit rather than one-off study bursts
        const weeklyGoalTarget = 5;
        const weeklyGoal = {
            target: weeklyGoalTarget,
            current: thisWeekActivity,
            progressPercentage: Math.min(100, Math.round((thisWeekActivity / weeklyGoalTarget) * 100)),
        };

        // Next milestones (locked achievements) so students always see the next thing to strive for
        const streakMilestones = [3, 7, 14, 30];
        const courseMilestones = [1, 3, 5, 10];
        const progressMilestones = [25, 50, 75, 100];

        const nextMilestones: { category: string; label: string; current: number; target: number; progressPercentage: number }[] = [];

        const nextStreakTarget = streakMilestones.find(t => t > currentStreak);
        if (nextStreakTarget) {
            nextMilestones.push({
                category: 'streak',
                label: `${nextStreakTarget} dni nauki z rzędu`,
                current: currentStreak,
                target: nextStreakTarget,
                progressPercentage: Math.round((currentStreak / nextStreakTarget) * 100),
            });
        }

        const nextCourseTarget = courseMilestones.find(t => t > completedCoursesCount);
        if (nextCourseTarget) {
            nextMilestones.push({
                category: 'courses',
                label: `${nextCourseTarget} ukończonych kursów`,
                current: completedCoursesCount,
                target: nextCourseTarget,
                progressPercentage: Math.round((completedCoursesCount / nextCourseTarget) * 100),
            });
        }

        const nextProgressTarget = progressMilestones.find(t => t > overallProgress);
        if (nextProgressTarget) {
            nextMilestones.push({
                category: 'progress',
                label: `${nextProgressTarget}% ogólnego postępu`,
                current: overallProgress,
                target: nextProgressTarget,
                progressPercentage: Math.round((overallProgress / nextProgressTarget) * 100),
            });
        }

        return NextResponse.json({
            // Basic stats
            enrolledCoursesCount,
            completedCoursesCount,
            totalModules,
            completedModules,
            inProgressModules,
            overallProgress,
            currentStreak,
            thisWeekActivity,
            thisMonthActivity,

            // Motivation-focused data
            streakAtRisk,
            nextBestAction,
            weeklyGoal,
            nextMilestones,

            // Detailed data
            courseProgress,
            pathProgress,
            recentCompletions: recentCompletions.map(rc => ({
                id: rc.id,
                moduleTitle: rc.module.title,
                courseTitle: rc.module.course?.title || 'Nieznany kurs',
                completedAt: rc.updatedAt
            })),
            achievements,

            // User info
            userInfo: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                memberSince: user.createdAt
            }
        });

    } catch (error) {
        console.error("Error fetching student analytics:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}