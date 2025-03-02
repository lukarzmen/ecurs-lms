import { db } from "@/lib/db";

interface GetChapterProps {
    userId: string;
    courseId: number;
    chapterId: number;
}

export const getChapter = async ({ userId, courseId, chapterId }: GetChapterProps) => {
    
    try {
        const course = await db.course.findUnique({
            where: {
            id: courseId,
            userId,
            }
        });

    const module = await db.module.findUnique({
        where: {
            id: chapterId
        },
    });

    if(!module || !course) {
        throw new Error("Chapter or course not found");
    }
    
 

    return {
        module,
        course
    }

} catch (error) {
    console.error("[GET CHAPTER ERROR]", error);
    return {
        chapter: null,
        course: null
    }
}
};