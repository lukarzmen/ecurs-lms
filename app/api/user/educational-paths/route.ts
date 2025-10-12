import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export interface UserEducationalPathDetails {
	id: number;
	title: string;
	imageId: string | null;
	author: {
		displayName?: string | null;
		firstName: string | null;
		lastName: string | null;
	} | null;
	category: { id: number; name: string } | null;
	enrolled: boolean;
	modulesCount: number;
    type: "educationalPath";
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get("userId");
	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	// Find user
	const user = await db.user.findUnique({
		where: { providerId: userId },
		select: { id: true }
	});
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Get all enrolled educational paths for user
	const userEduPaths = await db.userEducationalPath.findMany({
		where: { userId: user.id, state: 1 },
		select: { educationalPathId: true }
	});
	const enrolledEduPathIds = userEduPaths.map(up => up.educationalPathId);

	// Fetch all enrolled educational paths
	const educationalPaths = await db.educationalPath.findMany({
		where: { id: { in: enrolledEduPathIds } },
	});

	// Fetch details for each path and count finished/in-progress
	let finishedCount = 0;
	let unfinishedCount = 0;
	const result: UserEducationalPathDetails[] = await Promise.all(
		educationalPaths.map(async (path) => {
			// Fetch author
			let authorObj = null;
			if (path.authorId) {
				authorObj = await db.user.findUnique({
					where: { id: path.authorId },
					select: { displayName: true, firstName: true, lastName: true }
				});
			}
			// Fetch category
			let categoryObj = null;
			if (path.categoryId) {
				categoryObj = await db.category.findUnique({
					where: { id: path.categoryId },
					select: { id: true, name: true }
				});
			}
			// Count courses in educational path
			const coursesCount = await db.educationalPathCourse.count({
				where: { educationalPathId: path.id }
			});
			// Count finished courses in path for user
			const courseIds = (await db.educationalPathCourse.findMany({
				where: { educationalPathId: path.id },
				select: { courseId: true }
			})).map(c => c.courseId);
			let finishedCourses = 0;
			let unfinishedCourses = 0;
			if (courseIds.length > 0) {
				const userCourses = await db.userCourse.findMany({
					where: {
						userId: user.id,
						courseId: { in: courseIds },
					},
					select: { state: true }
				});
				userCourses.forEach(uc => {
					if (uc.state === 2) finishedCourses++;
					else unfinishedCourses++;
				});
			}
			// Path is finished if all courses are finished
			const isFinished = coursesCount > 0 && finishedCourses === coursesCount;
			if (isFinished) finishedCount++;
			else unfinishedCount++;
			return {
				id: path.id,
				title: path.title,
				imageId: path.imageId ?? null,
				author: authorObj
					? {
						displayName: authorObj.displayName,
						firstName: authorObj.firstName,
						lastName: authorObj.lastName,
					}
					: null,
				category: categoryObj ? { id: categoryObj.id, name: categoryObj.name } : null,
				enrolled: true,
				modulesCount: coursesCount,
				type: "educationalPath",
			};
		})
	);

	return NextResponse.json({ educationalPaths: result, finishedCount, unfinishedCount }, { status: 200 });
}
