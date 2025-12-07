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
            select: { id: true },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Kursy autora
        const authorCourses = await db.course.findMany({
            where: { authorId: user.id },
            select: { id: true, title: true },
        });
        console.log("Author courses found for user", user.id, ":", authorCourses.length);
        const authorCourseIds = authorCourses.map(c => c.id);

        // Ścieżki edukacyjne autora
        const authorPaths = await db.educationalPath.findMany({
            where: { authorId: user.id },
            select: { id: true, title: true },
        });
        const authorPathIds = authorPaths.map(p => p.id);

        // Unikalni użytkownicy zapisani na ścieżki autora
        const userPathsGroup = await db.userEducationalPath.groupBy({
            by: ['userId'],
            where: { educationalPathId: { in: authorPathIds } },
        });
        const pathUserCount = userPathsGroup.length;

        // Liczba ścieżek autora
        const pathsCount = authorPathIds.length;

        // Liczba kursów we wszystkich ścieżkach autora
        const pathCoursesCount = await db.educationalPathCourse.count({
            where: { educationalPathId: { in: authorPathIds } },
        });

        // Średni procent ukończenia ścieżek (średnia completion rate dla wszystkich ścieżek autora)
        let totalPathCompletionRate = 0;
        let countedPaths = 0;
        for (const path of authorPaths) {
            const pathCourses = await db.educationalPathCourse.findMany({
                where: { educationalPathId: path.id },
                select: { courseId: true },
            });
            const courseIds = pathCourses.map(pc => pc.courseId);
            if (courseIds.length === 0) continue;
            // Użytkownicy, którzy ukończyli wszystkie kursy w ścieżce
            const finishedUserPaths = await db.userEducationalPath.findMany({
                where: { educationalPathId: path.id, state: 2 },
                select: { userId: true },
            });
            const enrolledUserPaths = await db.userEducationalPath.count({ where: { educationalPathId: path.id } });
            const completionRate = enrolledUserPaths > 0 ? finishedUserPaths.length / enrolledUserPaths : 0;
            totalPathCompletionRate += completionRate;
            countedPaths++;
        }
        const averagePathCompletionRate = countedPaths > 0 ? ((totalPathCompletionRate / countedPaths) * 100).toFixed(2) + "%" : "0%";

        // Najpopularniejsza ścieżka (najwięcej zapisów)
        let mostPopularPath = "Brak danych";
        let mostPopularPathCount = 0;
        for (const path of authorPaths) {
            const count = await db.userEducationalPath.count({ where: { educationalPathId: path.id } });
            if (count > mostPopularPathCount) {
                mostPopularPathCount = count;
                mostPopularPath = path.title;
            }
        }

        // Najmniej popularna ścieżka (najmniej zapisów)
        let leastPopularPath = "Brak danych";
        let leastPopularPathCount = Number.MAX_SAFE_INTEGER;
        for (const path of authorPaths) {
            const count = await db.userEducationalPath.count({ where: { educationalPathId: path.id } });
            if (count < leastPopularPathCount) {
                leastPopularPathCount = count;
                leastPopularPath = path.title;
            }
        }

        // Nowi użytkownicy ścieżek w ostatnim miesiącu
        const lastMonthPath = new Date();
        lastMonthPath.setMonth(lastMonthPath.getMonth() - 1);
        const newPathUsersLastMonth = await db.userEducationalPath.groupBy({
            by: ['userId'],
            where: {
                educationalPathId: { in: authorPathIds },
                createdAt: { gte: lastMonthPath },
            },
        });

        // Nowe ścieżki w ostatnim miesiącu
        const newPathsLastMonth = await db.educationalPath.count({
            where: {
                authorId: user.id,
                createdAt: { gte: lastMonthPath },
            },
        });

        // Szczegółowe statystyki dla każdej ścieżki autora
        const pathsDetails = [];
        for (const path of authorPaths) {
            // Liczba użytkowników zapisanych na ścieżkę
            const usersCount = await db.userEducationalPath.count({ where: { educationalPathId: path.id } });
            // Liczba kursów w ścieżce
            const coursesCount = await db.educationalPathCourse.count({ where: { educationalPathId: path.id } });
            // Użytkownicy, którzy ukończyli ścieżkę
            const finishedUsersCount = await db.userEducationalPath.count({ where: { educationalPathId: path.id, state: 2 } });
            // Średni procent ukończenia ścieżki
            const averageCompletionRate = usersCount > 0 ? ((finishedUsersCount / usersCount) * 100).toFixed(2) + "%" : "0%";
            pathsDetails.push({
                id: path.id,
                title: path.title,
                usersCount,
                coursesCount,
                averageCompletionRate,
            });
        }

        // Unikalni użytkownicy zapisani na kursy autora
        const userCoursesGroup = await db.userCourse.groupBy({
            by: ['userId'],
            where: { courseId: { in: authorCourseIds } },
        });
        const userCount = userCoursesGroup.length;

        // Liczba kursów autora
        const coursesCount = authorCourseIds.length;

        // Liczba modułów we wszystkich kursach autora
        const modulesCount = await db.module.count({
            where: { courseId: { in: authorCourseIds } },
        });

        // Średni procent ukończenia kursów (średnia completion rate dla wszystkich kursów autora)
        let totalCompletionRate = 0;
        let countedCourses = 0;
        for (const course of authorCourses) {
            const modules = await db.module.findMany({
                where: { courseId: course.id },
                select: { id: true },
            });
            const moduleIds = modules.map(m => m.id);
            if (moduleIds.length === 0) continue;

            // Użytkownicy, którzy ukończyli wszystkie moduły
            const finishedModules = await db.userModule.findMany({
                where: {
                    moduleId: { in: moduleIds },
                    isFinished: true,
                },
                select: { userId: true, moduleId: true },
            });

            // Map userId to set of finished moduleIds
            const userModuleMap: Record<string, Set<string>> = {};
            for (const fm of finishedModules) {
                if (!userModuleMap[fm.userId]) {
                    userModuleMap[fm.userId] = new Set();
                }
                userModuleMap[fm.userId].add(fm.moduleId.toString());
            }
            // Count users who finished all modules
            const finishedUsersCount = Object.values(userModuleMap).filter(set => set.size === moduleIds.length).length;

            const enrolledUsers = await db.userCourse.count({ where: { courseId: course.id } });
            const completionRate = enrolledUsers > 0 ? finishedUsersCount / enrolledUsers : 0;
            totalCompletionRate += completionRate;
            countedCourses++;
        }
        const averageCompletionRate = countedCourses > 0 ? ((totalCompletionRate / countedCourses) * 100).toFixed(2) + "%" : "0%";

        // Liczba aktywnych użytkowników (ukończyli przynajmniej jeden moduł w ostatnich 7 dni)
        const activeSince = new Date();
        activeSince.setDate(activeSince.getDate() - 7);
        const activeUsers = await db.userModule.findMany({
            where: {
                module: { course: { authorId: user.id } },
                isFinished: true,
                updatedAt: { gte: activeSince },
            },
            select: { userId: true },
        });
        const activeUserCount = new Set(activeUsers.map(u => u.userId)).size;

        // Kurs z najwyższym procentem ukończenia (spośród kursów autora)
        let bestCompletionCourse = "Brak danych";
        let bestCompletionRate = 0;
        for (const course of authorCourses) {
            const modules = await db.module.findMany({
                where: { courseId: course.id },
                select: { id: true },
            });
            const moduleIds = modules.map(m => m.id);
            if (moduleIds.length === 0) continue;

            // Użytkownicy, którzy ukończyli wszystkie moduły
            const finishedModules = await db.userModule.findMany({
                where: {
                    moduleId: { in: moduleIds },
                    isFinished: true,
                },
                select: { userId: true, moduleId: true },
            });

            // Map userId to set of finished moduleIds
            const userModuleMap: Record<string, Set<string>> = {};
            for (const fm of finishedModules) {
                if (!userModuleMap[fm.userId]) {
                    userModuleMap[fm.userId] = new Set();
                }
                userModuleMap[fm.userId].add(fm.moduleId.toString());
            }
            // Count users who finished all modules
            const finishedUsersCount = Object.values(userModuleMap).filter(set => set.size === moduleIds.length).length;

            const enrolledUsers = await db.userCourse.count({ where: { courseId: course.id } });
            const completionRate = enrolledUsers > 0 ? finishedUsersCount / enrolledUsers : 0;
            if (completionRate > bestCompletionRate) {
                bestCompletionRate = completionRate;
                bestCompletionCourse = course.title;
            }
        }

        // Liczba powracających użytkowników (zapisanych na więcej niż jeden kurs autora)
        const multiCourseUsers = await db.userCourse.groupBy({
            by: ['userId'],
            where: { courseId: { in: authorCourseIds } },
            _count: { courseId: true },
            having: { courseId: { _count: { gt: 1 } } }
        });
        const returningUsersCount = multiCourseUsers.length;

        // Najpopularniejszy kurs (najwięcej zapisów)
        let mostPopularCourse = "Brak danych";
        let mostPopularCount = 0;
        for (const course of authorCourses) {
            const count = await db.userCourse.count({ where: { courseId: course.id } });
            if (count > mostPopularCount) {
                mostPopularCount = count;
                mostPopularCourse = course.title;
            }
        }

        // Najmniej popularny kurs (najmniej zapisów)
        let leastPopularCourse = "Brak danych";
        let leastPopularCount = Number.MAX_SAFE_INTEGER;
        for (const course of authorCourses) {
            const count = await db.userCourse.count({ where: { courseId: course.id } });
            if (count < leastPopularCount) {
                leastPopularCount = count;
                leastPopularCourse = course.title;
            }
        }

        // Nowi kursanci w ostatnim miesiącu
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const newUsersLastMonth = await db.userCourse.groupBy({
            by: ['userId'],
            where: {
                courseId: { in: authorCourseIds },
                createdAt: { gte: lastMonth },
            },
        });

        // Nowe kursy w ostatnim miesiącu
        const newCoursesLastMonth = await db.course.count({
            where: {
                authorId: user.id,
                createdAt: { gte: lastMonth },
            },
        });

        // --- STUDENT ANALYTICS ---

        // Najmniej aktywny student (najmniej ukończonych modułów w kursach autora)
        const studentModuleCounts = await db.userModule.groupBy({
            by: ['userId'],
            where: {
                module: { course: { authorId: user.id } },
                isFinished: true,
            },
            _count: true,
        });

        let leastActiveStudent = "Brak danych";
        let leastActiveCount = Number.MAX_SAFE_INTEGER;
        let mostActiveStudent = "Brak danych";
        let mostActiveCount = 0;

        for (const s of studentModuleCounts) {
            const student = await db.user.findUnique({ where: { id: s.userId }, select: { email: true, firstName: true, lastName: true } });
            const label = student?.email || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || s.userId.toString();
            if (s._count < leastActiveCount) {
                leastActiveCount = s._count;
                leastActiveStudent = label;
            }
            if (s._count > mostActiveCount) {
                mostActiveCount = s._count;
                mostActiveStudent = label;
            }
        }

        // Student zapisany na największą liczbę kursów autora
        const studentCourses = await db.userCourse.groupBy({
            by: ['userId'],
            where: { courseId: { in: authorCourseIds } },
            _count: { courseId: true },
        });
        let mostCoursesStudent = "Brak danych";
        let mostCoursesCount = 0;
        for (const sc of studentCourses) {
            if (sc._count.courseId > mostCoursesCount) {
                mostCoursesCount = sc._count.courseId;
                const student = await db.user.findUnique({ where: { id: sc.userId }, select: { email: true, firstName: true, lastName: true } });
                mostCoursesStudent = student?.email || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || sc.userId.toString();
            }
        }

        // Szczegółowe statystyki dla każdego kursu autora
        const coursesDetails = [];
        for (const course of authorCourses) {
            // Liczba użytkowników zapisanych na kurs
            const usersCount = await db.userCourse.count({ where: { courseId: course.id } });

            // Liczba modułów w kursie
            const modulesCount = await db.module.count({ where: { courseId: course.id } });

            // Moduły tego kursu
            const modules = await db.module.findMany({
                where: { courseId: course.id },
                select: { id: true },
            });
            const moduleIds = modules.map(m => m.id);

            // Użytkownicy, którzy ukończyli wszystkie moduły
            let averageCompletionRate = "0%";
            if (moduleIds.length > 0) {
                const finishedModules = await db.userModule.findMany({
                    where: {
                        moduleId: { in: moduleIds },
                        isFinished: true,
                    },
                    select: { userId: true, moduleId: true },
                });

                // Map userId to set of finished moduleIds
                const userModuleMap: Record<string, Set<string>> = {};
                for (const fm of finishedModules) {
                    if (!userModuleMap[fm.userId]) {
                        userModuleMap[fm.userId] = new Set();
                    }
                    userModuleMap[fm.userId].add(fm.moduleId.toString());
                }
                // Count users who finished all modules
                const finishedUsersCount = Object.values(userModuleMap).filter(set => set.size === moduleIds.length).length;
                averageCompletionRate = usersCount > 0 ? ((finishedUsersCount / usersCount) * 100).toFixed(2) + "%" : "0%";
            }

            // Najbardziej aktywny użytkownik (najwięcej ukończonych modułów w tym kursie)
            const userModuleCounts = await db.userModule.groupBy({
                by: ['userId'],
                where: {
                    moduleId: { in: moduleIds },
                    isFinished: true,
                },
                _count: { id: true },
            });
            let mostActiveUser = "Brak danych";
            let mostActiveCount = 0;
            let lastActiveUser = "Brak danych";
            let lastActiveDate: Date | null = null;

            for (const umc of userModuleCounts) {
                if (umc._count.id > mostActiveCount) {
                    mostActiveCount = umc._count.id;
                    const user = await db.user.findUnique({ where: { id: umc.userId }, select: { email: true, firstName: true, lastName: true } });
                    mostActiveUser = user?.email || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || umc.userId.toString();
                }
            }

            // Ostatnio aktywny użytkownik (ostatni ukończony moduł w kursie)
            const lastFinished = await db.userModule.findFirst({
                where: {
                    moduleId: { in: moduleIds },
                    isFinished: true,
                },
                orderBy: { updatedAt: "desc" },
                select: { userId: true, updatedAt: true },
            });
            if (lastFinished) {
                const user = await db.user.findUnique({ where: { id: lastFinished.userId }, select: { email: true, firstName: true, lastName: true } });
                lastActiveUser = user?.email || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || lastFinished.userId.toString();
                lastActiveDate = lastFinished.updatedAt;
            }

            coursesDetails.push({
                id: course.id,
                title: course.title,
                usersCount,
                modulesCount,
                averageCompletionRate,
                mostActiveUser,
                lastActiveUser,
                lastActiveDate,
            });
        }

        return NextResponse.json({
            userCount,
            coursesCount,
            modulesCount,
            averageCompletionRate,
            activeUserCount,
            returningUsersCount,
            mostPopularCourse,
            leastPopularCourse,
            newUsersLastMonth: newUsersLastMonth.length,
            newCoursesLastMonth,
            leastActiveStudent,
            mostActiveStudent,
            mostCoursesStudent,
            coursesDetails, // <--- new field
            // --- Educational Path Analytics ---
            pathUserCount,
            pathsCount,
            pathCoursesCount,
            averagePathCompletionRate,
            mostPopularPath,
            leastPopularPath,
            newPathUsersLastMonth: newPathUsersLastMonth.length,
            newPathsLastMonth,
            pathsDetails,
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}