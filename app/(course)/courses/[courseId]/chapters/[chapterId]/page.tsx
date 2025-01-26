import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import LexicalEditor from "@/components/editor/LexicalEditor"; // Assuming this is used elsewhere
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChapterContent from "./__components/chapter-content";

const ChapterIdPage = async ({
    params,
  }: {
    params: {
      courseId: string;
      chapterId: string;
    };
  }) => {
    // Await authentication
    const user = await auth();

    // Redirect to home if user is not authenticated
    if (!user) {
        return redirect("/sign-in");
    }

    // Fetch chapter data
    const {
        courseId, chapterId
    } = await params;
    const getChapterInputParams = {
        userId: user.userId ?? "",
        courseId: courseId,
        chapterId: chapterId,
    };
    const chapterData = await getChapter(getChapterInputParams);
    if (typeof chapterData === 'string') {
        return redirect("/");
    }
    const { chapter, course, attachments } = chapterData;

    // Redirect if chapter or course is not found
    if (!chapter || !course) {
        return redirect("/");
    }

    // Determine if the chapter is locked or completed
    const isLocked = !chapter.isFree;// && !course.isPurchased;
    const isCompleted = false;//!!chapter.userProgress?.[0]?.isCompleted;

    console.log("content", chapter.description);
    return (
        <div>
            {/* Display banners based on the chapter state */}
            {isCompleted && (
                <Banner variant="success" label="Chapter completed" />
            )}
            {isLocked && (
                <Banner
                    variant="warning"
                    label="You need to purchase this course to watch this chapter"
                />
            )}
            
            {/* Chapter content */}
            <div className="flex flex-col mx-auto pb-20">
                <h1 className="text-3xl font-semibold pl-5">{chapter.title}</h1>
                <div className="p-4">
                    <ChapterContent content={chapter.description} />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
