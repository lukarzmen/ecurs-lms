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
        courseId: parseInt(courseId, 10),
        chapterId: parseInt(chapterId, 10),
    };
    const chapterData = await getChapter(getChapterInputParams);
    if (typeof chapterData === 'string') {
        return redirect("/");
    }
    const { module, course } = chapterData;

    // Redirect if chapter or course is not found
    if (!module || !course) {
        return redirect("/");
    }

    const isCompleted = false;//!!chapter.userProgress?.[0]?.isCompleted;
    return (
        <div>
            {/* Display banners based on the chapter state */}
            {isCompleted && (
                <Banner variant="success" label="Chapter completed" />
            )}
            
            {/* Chapter content */}
            <div className="flex flex-col mx-auto">
                <h1 className="text-2xl font-semibold text-center p-2">{module.title}</h1>
                <div className="p-4">
                    <ChapterContent content={module.moduleContentId} />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
