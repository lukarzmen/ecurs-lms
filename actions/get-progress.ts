import { db } from "@/lib/db";

export const getProgress = async (userId: string, courseId: string): Promise<number> => {
    try {
        const publishedChapters = await db.chapter.findMany({
            where: {
                courseId: courseId,
                isPublished: true,
            },
            select: {
                id: true
            }

        });

        const publishChapterIds = publishedChapters.map((chapter) => chapter.id);
        const validCompletedChapters = await db.userProgress.count({
            where: {
                userId: userId,
                chapterId: {
                    in: publishChapterIds,
                },
                isCompleted: true,
            }
        })

        const progressPercentage = (validCompletedChapters / publishedChapters.length) * 100;
        return progressPercentage;

    } catch (error) {
        console.error(error);
        return 0;
    }

}