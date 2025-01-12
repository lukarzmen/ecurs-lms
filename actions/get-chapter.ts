import { db } from "@/lib/db";

interface GetChapterProps {
    userId: string;
    courseId: string;
    chapterId: string;
}

export const getChapter = async ({ userId, courseId, chapterId }: GetChapterProps) => {
    
    try {
        const course = await db.course.findUnique({
            where: {
                id: courseId,
                userId,
            },
            select: {
                price: true,
            }
        });

    const chapter = await db.chapter.findUnique({
        where: {
            id: chapterId,
            isPublished: true,
        },
   
    });

    if(!chapter || !course) {
        throw new Error("Chapter or course not found");
    }
    
    const attachments = await db.attachment.findMany({
        where: {
            courseId : courseId,
        },
    });

    return {
        chapter,
        course,
        attachments
    }

} catch (error) {
    console.error("[GET CHAPTER ERROR]", error);
    return {
        chapter: null,
        course: null,
        attachments: [],
    }
}
    

    return chapterId;
};