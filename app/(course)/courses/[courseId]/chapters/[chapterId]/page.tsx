import { Banner } from "@/components/banner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChapterContent from "./__components/chapter-content";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
    const { courseId, chapterId } = params;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
        method: 'POST',
        body: JSON.stringify({
            courseId,
            userId: userAuth.userId,
            sessionId: userAuth.sessionId,
        }),
    });

    const result = await response.json();
    if (!result.exists) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg text-gray-700">Nie masz uprawnień do dostępu do tego kursu.</p>
                <p className="text-sm text-gray-500">Poproś nauczyciela o pozwolenie na dostęp do tego kursu.</p>
            </div>
        );
    }

    // Fetch chapter data
    const chapterResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/chapters/${chapterId}`);
    if (!chapterResponse.ok) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg text-gray-700">Kurs jest niedostępny dla uczniów lub występują problemy.</p>
                <p className="text-sm text-gray-500">Skontaktuj się z autorem.</p>
            </div>
        );
    }
    const chapterData = await chapterResponse.json();

    const { module, course } = chapterData;
    // Redirect if chapter or course is not found
    if (!module || !course) {
        return redirect("/");
    }

    const isCompleted = false; // !!chapter.userProgress?.[0]?.isCompleted;
    return (
        <div>
            {/* Display banners based on the chapter state */}
            {isCompleted && (
                <Banner variant="success" label="Rozdział ukończony" />
            )}
            <Link
                href={`/`}
                className="flex items-center text-sm hover:opacity-75 transition p-4 ">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wróć do panelu kursów
            </Link>
            <div className="flex flex-col mx-auto">

                <h1 className="text-2xl font-semibold text-center p-2">{module.title}</h1>
                <div className="p-4">
                    <ChapterContent content={chapterId} />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
