import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChapterContent from "./__components/chapter-content";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ChapterIdPage = async ({
    params,
}: {
    params: {
        courseId: string;
        chapterId: string;
    };
}) => {
    // Await authentication
    const userAuth = await auth();

    // Redirect to home if user is not authenticated
    if (!userAuth) {
        return redirect("/sign-in");
    }
    const user = userAuth.userId;
    const { courseId, chapterId } = params;
    // Post user permission using user data
    const response = await fetch(`${process.env.URL}/api/permissions`, {
        method: 'POST',
        body: JSON.stringify({
            courseId,
            userId: userAuth.userId,
            sessionId : userAuth.sessionId,
        }),
    });

    const result = await response.json();

    if (!result.exists) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg text-gray-700">Ask teacher for permission to access this course.</p>
            </div>
        );
    }
    // Fetch chapter data
    const getChapterInputParams = {
        userId: userAuth.userId ?? "",
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
            <Link
                href={`/`}
                className="flex items-center text-sm hover:opacity-75 transition p-4 ">
                <ArrowLeft className="h-4 w-4 mr-2"></ArrowLeft>
                Back to dashboard
            </Link>
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
