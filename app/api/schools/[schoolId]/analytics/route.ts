import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ schoolId: string }> }) {
    try {
        const { schoolId: schoolIdParam } = await params;
        const schoolId = parseInt(schoolIdParam);
        
        console.log("School analytics request for schoolId:", schoolId);
        
        if (!schoolId) {
            return new NextResponse("Missing schoolId", { status: 400 });
        }

        const school = await db.school.findUnique({
            where: { id: schoolId },
            select: { id: true },
        });

        if (!school) {
            return new NextResponse("School not found", { status: 404 });
        }

        // Get all school teachers first
        const schoolTeachers = await db.schoolTeacher.findMany({
            where: { schoolId: schoolId },
            select: { teacherId: true },
        });
        const teacherIds = schoolTeachers.map(st => st.teacherId);
        console.log("School teachers found:", schoolTeachers.length, "with ids:", teacherIds);

        // Build where clause for courses - handle empty teacherIds
        const courseWhereClause: any = {
            OR: [
                { schoolId: schoolId },  // Courses directly assigned to school
            ]
        };
        
        // Only add teacher courses filter if we have teachers
        if (teacherIds.length > 0) {
            courseWhereClause.OR.push({ authorId: { in: teacherIds } });
        }

        // Get all courses for the school - both directly assigned and taught by school teachers
        const schoolCourses = await db.course.findMany({
            where: courseWhereClause,
            select: { id: true, title: true, authorId: true, schoolId: true },
        });   
        const schoolCourseIds = schoolCourses.map(c => c.id);

        // Build where clause for paths - handle empty teacherIds
        const pathWhereClause: any = {
            OR: [
                { schoolId: schoolId },  // Paths directly assigned to school
            ]
        };
        
        // Only add teacher paths filter if we have teachers
        if (teacherIds.length > 0) {
            pathWhereClause.OR.push({ authorId: { in: teacherIds } });
        }

        // Get all educational paths for the school
        const schoolPaths = await db.educationalPath.findMany({
            where: pathWhereClause,
            select: { id: true, title: true, authorId: true },
        });
        console.log("School paths found:", schoolPaths.length, "for schoolId:", schoolId);
        const schoolPathIds = schoolPaths.map(p => p.id);

        // === COURSES ANALYTICS ===

        // Unique students enrolled in school courses
        let totalStudentsCount = 0;
        if (schoolCourseIds.length > 0) {
            const studentCoursesGroup = await db.userCourse.groupBy({
                by: ['userId'],
                where: { courseId: { in: schoolCourseIds } },
            });
            totalStudentsCount = studentCoursesGroup.length;
        }

        // Total courses in school
        const totalCoursesCount = schoolCourseIds.length;

        // Total modules in school courses
        let totalModulesCount = 0;
        if (schoolCourseIds.length > 0) {
            totalModulesCount = await db.module.count({
                where: { courseId: { in: schoolCourseIds } },
            });
        }

        // Average completion rate for school courses
        let totalCompletionRate = 0;
        let countedCourses = 0;
        for (const course of schoolCourses) {
            const modules = await db.module.findMany({
                where: { courseId: course.id },
                select: { id: true },
            });
            const moduleIds = modules.map(m => m.id);
            if (moduleIds.length === 0) continue;

            const finishedModules = await db.userModule.findMany({
                where: {
                    moduleId: { in: moduleIds },
                    isFinished: true,
                },
                select: { userId: true, moduleId: true },
            });

            const userModuleMap: Record<string, Set<string>> = {};
            for (const fm of finishedModules) {
                if (!userModuleMap[fm.userId]) {
                    userModuleMap[fm.userId] = new Set();
                }
                userModuleMap[fm.userId].add(fm.moduleId.toString());
            }

            const finishedUsersCount = Object.values(userModuleMap).filter(set => set.size === moduleIds.length).length;
            const enrolledUsers = await db.userCourse.count({ where: { courseId: course.id } });
            const completionRate = enrolledUsers > 0 ? finishedUsersCount / enrolledUsers : 0;
            totalCompletionRate += completionRate;
            countedCourses++;
        }
        const averageCompletionRate = countedCourses > 0 ? ((totalCompletionRate / countedCourses) * 100).toFixed(2) + "%" : "0%";

        // Active students (finished at least one module in last 7 days)
        const activeSince = new Date();
        activeSince.setDate(activeSince.getDate() - 7);
        const activeStudents = await db.userModule.findMany({
            where: {
                module: { course: { schoolId: schoolId } },
                isFinished: true,
                updatedAt: { gte: activeSince },
            },
            select: { userId: true },
        });
        const activeStudentsCount = new Set(activeStudents.map(u => u.userId)).size;

        // Returning students (enrolled in more than one course)
        let returningStudentsCount = 0;
        if (schoolCourseIds.length > 0) {
            const multiCourseStudents = await db.userCourse.groupBy({
                by: ['userId'],
                where: { courseId: { in: schoolCourseIds } },
                _count: { courseId: true },
                having: { courseId: { _count: { gt: 1 } } }
            });
            returningStudentsCount = multiCourseStudents.length;
        }

        // Most popular course (most enrollments) - optimized
        let mostPopularCourse = "No data";
        let mostPopularCount = 0;
        let leastPopularCourse = "No data";
        let leastPopularCount = Number.MAX_SAFE_INTEGER;
        
        if (schoolCourseIds.length > 0) {
            // Get all course enrollments in one query
            const courseEnrollments = await db.userCourse.groupBy({
                by: ['courseId'],
                where: { courseId: { in: schoolCourseIds } },
                _count: true,
            });

            for (const enrollment of courseEnrollments) {
                const course = schoolCourses.find(c => c.id === enrollment.courseId);
                const count = enrollment._count;
                
                if (count > mostPopularCount) {
                    mostPopularCount = count;
                    mostPopularCourse = course?.title || "Unknown";
                }
                if (count < leastPopularCount) {
                    leastPopularCount = count;
                    leastPopularCourse = course?.title || "Unknown";
                }
            }
        }

        // New students in last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const newStudentsLastMonth = await db.userCourse.groupBy({
            by: ['userId'],
            where: {
                courseId: { in: schoolCourseIds },
                createdAt: { gte: lastMonth },
            },
        });

        // New courses in last month
        const newCoursesLastMonth = await db.course.count({
            where: {
                schoolId: schoolId,
                createdAt: { gte: lastMonth },
            },
        });

        // === EDUCATIONAL PATHS ANALYTICS ===

        // Unique students in paths
        let pathStudentsCount = 0;
        if (schoolPathIds.length > 0) {
            const studentPathsGroup = await db.userEducationalPath.groupBy({
                by: ['userId'],
                where: { educationalPathId: { in: schoolPathIds } },
            });
            pathStudentsCount = studentPathsGroup.length;
        }

        // Total paths
        const totalPathsCount = schoolPathIds.length;

        // Total courses in paths
        let totalPathCoursesCount = 0;
        if (schoolPathIds.length > 0) {
            totalPathCoursesCount = await db.educationalPathCourse.count({
                where: { educationalPathId: { in: schoolPathIds } },
            });
        }

        // Average completion rate for paths - optimized
        let totalPathCompletionRate = 0;
        let countedPaths = 0;
        
        if (schoolPathIds.length > 0) {
            // Batch fetch all path courses
            const allPathCourses = await db.educationalPathCourse.findMany({
                where: { educationalPathId: { in: schoolPathIds } },
                select: { educationalPathId: true, courseId: true },
            });
            
            // Batch fetch all path enrollments
            const allPathEnrollments = await db.userEducationalPath.findMany({
                where: { educationalPathId: { in: schoolPathIds } },
                select: { educationalPathId: true, userId: true, state: true },
            });
            
            // Build maps for calculation
            const pathCoursesMap: Record<number, number> = {};
            const pathEnrollmentsMap: Record<number, { users: Set<number>; finished: Set<number> }> = {};
            
            for (const pc of allPathCourses) {
                pathCoursesMap[pc.educationalPathId] = (pathCoursesMap[pc.educationalPathId] || 0) + 1;
            }
            
            for (const pe of allPathEnrollments) {
                if (!pathEnrollmentsMap[pe.educationalPathId]) {
                    pathEnrollmentsMap[pe.educationalPathId] = { users: new Set(), finished: new Set() };
                }
                pathEnrollmentsMap[pe.educationalPathId].users.add(pe.userId);
                if (pe.state === 2) {
                    pathEnrollmentsMap[pe.educationalPathId].finished.add(pe.userId);
                }
            }
            
            // Calculate completion rates
            for (const path of schoolPaths) {
                const enrollments = pathEnrollmentsMap[path.id];
                if (!enrollments || enrollments.users.size === 0) continue;
                
                const completionRate = enrollments.finished.size / enrollments.users.size;
                totalPathCompletionRate += completionRate;
                countedPaths++;
            }
        }
        const averagePathCompletionRate = countedPaths > 0 ? ((totalPathCompletionRate / countedPaths) * 100).toFixed(2) + "%" : "0%";

        // Most popular path - optimized
        let mostPopularPath = "No data";
        let mostPopularPathCount = 0;
        let leastPopularPath = "No data";
        let leastPopularPathCount = Number.MAX_SAFE_INTEGER;
        
        if (schoolPathIds.length > 0) {
            // Get all path enrollments in one query
            const pathEnrollments = await db.userEducationalPath.groupBy({
                by: ['educationalPathId'],
                where: { educationalPathId: { in: schoolPathIds } },
                _count: true,
            });

            for (const enrollment of pathEnrollments) {
                const path = schoolPaths.find(p => p.id === enrollment.educationalPathId);
                const count = enrollment._count;
                
                if (count > mostPopularPathCount) {
                    mostPopularPathCount = count;
                    mostPopularPath = path?.title || "Unknown";
                }
                if (count < leastPopularPathCount) {
                    leastPopularPathCount = count;
                    leastPopularPath = path?.title || "Unknown";
                }
            }
        }

        // New students in paths (last month)
        const newPathStudentsLastMonth = await db.userEducationalPath.groupBy({
            by: ['userId'],
            where: {
                educationalPathId: { in: schoolPathIds },
                createdAt: { gte: lastMonth },
            },
        });

        // New paths (last month)
        const newPathsLastMonth = await db.educationalPath.count({
            where: {
                schoolId: schoolId,
                createdAt: { gte: lastMonth },
            },
        });

        // === TEACHER ANALYTICS ===

        // Total teachers in school
        const teachersCount = await db.schoolTeacher.count({
            where: { schoolId: schoolId },
        });

        // Most active teacher (most finished modules by their students)
        const teacherCourses = await db.course.findMany({
            where: { schoolId: schoolId },
            select: { id: true, authorId: true, title: true },
        });

        interface TeacherStats {
            teacherId: number;
            courseTitle: string;
            finishedModulesCount: number;
        }

        const teacherStats: Record<number, { name: string; finishedModulesCount: number }> = {};
        
        for (const course of teacherCourses) {
            const modules = await db.module.findMany({
                where: { courseId: course.id },
                select: { id: true },
            });
            const moduleIds = modules.map(m => m.id);
            
            if (moduleIds.length > 0) {
                const finishedCount = await db.userModule.count({
                    where: {
                        moduleId: { in: moduleIds },
                        isFinished: true,
                    },
                });

                if (!teacherStats[course.authorId]) {
                    const teacher = await db.user.findUnique({
                        where: { id: course.authorId },
                        select: { email: true, firstName: true, lastName: true },
                    });
                    teacherStats[course.authorId] = {
                        name: teacher?.email || `${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim() || course.authorId.toString(),
                        finishedModulesCount: 0,
                    };
                }
                teacherStats[course.authorId].finishedModulesCount += finishedCount;
            }
        }

        let mostActiveTeacher = "No data";
        let mostActiveTeacherCount = 0;
        for (const [_, stats] of Object.entries(teacherStats)) {
            if (stats.finishedModulesCount > mostActiveTeacherCount) {
                mostActiveTeacherCount = stats.finishedModulesCount;
                mostActiveTeacher = stats.name;
            }
        }

        // === STUDENT ANALYTICS ===

        // Most active student (most finished modules)
        const studentModuleCounts = await db.userModule.groupBy({
            by: ['userId'],
            where: {
                module: { course: { schoolId: schoolId } },
                isFinished: true,
            },
            _count: true,
        });

        let mostActiveStudent = "No data";
        let mostActiveStudentCount = 0;
        let leastActiveStudent = "No data";
        let leastActiveStudentCount = Number.MAX_SAFE_INTEGER;

        for (const s of studentModuleCounts) {
            const student = await db.user.findUnique({
                where: { id: s.userId },
                select: { email: true, firstName: true, lastName: true },
            });
            const label = student?.email || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || s.userId.toString();
            
            if (s._count > mostActiveStudentCount) {
                mostActiveStudentCount = s._count;
                mostActiveStudent = label;
            }
            if (s._count < leastActiveStudentCount) {
                leastActiveStudentCount = s._count;
                leastActiveStudent = label;
            }
        }

        // Student enrolled in most courses
        let studentMostCourses = "No data";
        let mostCoursesCount = 0;
        if (schoolCourseIds.length > 0) {
            const studentCourses = await db.userCourse.groupBy({
                by: ['userId'],
                where: { courseId: { in: schoolCourseIds } },
                _count: { courseId: true },
            });
            for (const sc of studentCourses) {
                if (sc._count.courseId > mostCoursesCount) {
                    mostCoursesCount = sc._count.courseId;
                    const student = await db.user.findUnique({
                        where: { id: sc.userId },
                        select: { email: true, firstName: true, lastName: true },
                    });
                    studentMostCourses = student?.email || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || sc.userId.toString();
                }
            }
        }

        // Detailed course statistics - optimized
        const coursesDetails = [];
        
        // Get all modules for all courses in one query
        const allModules = await db.module.findMany({
            where: { courseId: { in: schoolCourseIds } },
            select: { id: true, courseId: true },
        });

        // Get all user course enrollments in one query
        const allCourseEnrollments = await db.userCourse.groupBy({
            by: ['courseId'],
            where: { courseId: { in: schoolCourseIds } },
            _count: true,
        });

        // Get all finished modules in one query
        const allModuleIds = allModules.map(m => m.id);
        const allFinishedModules = allModuleIds.length > 0 
            ? await db.userModule.findMany({
                where: {
                    moduleId: { in: allModuleIds },
                    isFinished: true,
                },
                select: { userId: true, moduleId: true },
            })
            : [];

        // Build maps for quick lookup
        const courseModulesMap: Record<number, number[]> = {};
        for (const mod of allModules) {
            const courseId = mod.courseId as number;
            if (!courseModulesMap[courseId]) {
                courseModulesMap[courseId] = [];
            }
            courseModulesMap[courseId].push(mod.id);
        }

        const courseEnrollmentMap: Record<number, number> = {};
        for (const enrollment of allCourseEnrollments) {
            courseEnrollmentMap[enrollment.courseId] = enrollment._count;
        }

        // Process each course with pre-fetched data
        for (const course of schoolCourses) {
            const usersCount = courseEnrollmentMap[course.id] || 0;
            const moduleIds = courseModulesMap[course.id] || [];
            const modulesCount = moduleIds.length;

            let courseCompletionRate = "0%";
            if (moduleIds.length > 0) {
                // Calculate completion rate from pre-fetched data
                const courseFinishedModules = allFinishedModules.filter(fm => moduleIds.includes(fm.moduleId));
                
                const userModuleMap: Record<string, Set<number>> = {};
                for (const fm of courseFinishedModules) {
                    if (!userModuleMap[fm.userId]) {
                        userModuleMap[fm.userId] = new Set();
                    }
                    userModuleMap[fm.userId].add(fm.moduleId);
                }

                const finishedUsersCount = Object.values(userModuleMap).filter(set => set.size === moduleIds.length).length;
                courseCompletionRate = usersCount > 0 ? ((finishedUsersCount / usersCount) * 100).toFixed(2) + "%" : "0%";
            }

            // Will be filled from teacher map
            const teacherName = "Unknown";

            coursesDetails.push({
                id: course.id,
                title: course.title,
                usersCount,
                modulesCount,
                averageCompletionRate: courseCompletionRate,
                teacher: teacherName,
            });
        }

        // Get all teachers in one query (using teacherIds already extracted at the top)
        const teachers = await db.user.findMany({
            where: { id: { in: teacherIds } },
            select: { id: true, email: true, firstName: true, lastName: true },
        });
        
        const teacherMap: Record<number, string> = {};
        for (const teacher of teachers) {
            const teacherName = teacher.email || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.id.toString();
            teacherMap[teacher.id] = teacherName;
        }

        // Update coursesDetails with teacher names
        for (const courseDetail of coursesDetails) {
            const course = schoolCourses.find(c => c.id === courseDetail.id);
            if (course) {
                courseDetail.teacher = teacherMap[course.authorId] || "Unknown";
            }
        }

        // Detailed path statistics
        const pathsDetails = [];
        for (const path of schoolPaths) {
            const usersCount = await db.userEducationalPath.count({ where: { educationalPathId: path.id } });
            const coursesCount = await db.educationalPathCourse.count({ where: { educationalPathId: path.id } });
            const finishedUsersCount = await db.userEducationalPath.count({ where: { educationalPathId: path.id, state: 2 } });
            const pathCompletionRate = usersCount > 0 ? ((finishedUsersCount / usersCount) * 100).toFixed(2) + "%" : "0%";

            pathsDetails.push({
                id: path.id,
                title: path.title,
                usersCount,
                coursesCount,
                averageCompletionRate: pathCompletionRate,
            });
        }

        return NextResponse.json({
            // Courses
            totalStudentsCount,
            totalCoursesCount,
            totalModulesCount,
            averageCompletionRate,
            activeStudentsCount,
            returningStudentsCount,
            mostPopularCourse,
            leastPopularCourse,
            newStudentsLastMonth: newStudentsLastMonth.length,
            newCoursesLastMonth,
            coursesDetails,
            // Paths
            pathStudentsCount,
            totalPathsCount,
            totalPathCoursesCount,
            averagePathCompletionRate,
            mostPopularPath,
            leastPopularPath,
            newPathStudentsLastMonth: newPathStudentsLastMonth.length,
            newPathsLastMonth,
            pathsDetails,
            // Teachers & Students
            teachersCount,
            mostActiveTeacher,
            mostActiveStudent,
            leastActiveStudent,
            studentMostCourses,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });

    } catch (error) {
        console.error("Error fetching school analytics:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
