'use client';

import { Banner } from "@/components/banner";
import { useAuth } from "@clerk/nextjs";
import ChapterContent from "./__components/chapter-content";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface ChapterData {
    module: {
        id: string;
        title: string;
        content: string;
    };
    course: {
        id: string;
    };
    userModule: {
        isFinished: boolean;
    } | null;
}

const ChapterIdPage = () => {
    const { userId } = useAuth();
    const params = useParams();
    const router = useRouter();

    const courseId = params.courseId as string;
    const chapterId = params.chapterId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chapterData, setChapterData] = useState<ChapterData | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [hasUserCourse, setHasUserCourse] = useState(false);

    useEffect(() => {
        if (!userId || !courseId || !chapterId) {
            if (!courseId || !chapterId) setError("Nieprawidłowe parametry trasy.");
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const permResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
                    method: 'POST',
                    body: JSON.stringify({ courseId, userId: userId }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!permResponse.ok) {
                    throw new Error("Sprawdzanie uprawnień nie powiodło się. Spróbuj ponownie później.");
                }

                const permResult = await permResponse.json();

                if (!permResult.hasAccess) {
                    throw new Error("Brak dostępu. Skontaktuj się z nauczycielem, aby uzyskać dostęp do tego kursu.");
                }

                setHasUserCourse(permResult.exists);

                const chapterResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/chapters/${chapterId}?providerId=${userId}`);
                if (!chapterResponse.ok) {
                    throw new Error("Nie udało się pobrać danych rozdziału lub kurs jest niedostępny.");
                }
                const data: ChapterData = await chapterResponse.json();

                if (!data.module || !data.course) {
                    throw new Error("Brak danych modułu lub kursu.");
                }

                setChapterData(data);
                setIsCompleted(!!data.userModule?.isFinished);

            } catch (err: any) {
                console.error("Fetch Error:", err);
                setError(err.message || "Przepraszamy. Wystąpił błąd. Spróbuj ponownie później.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [userId, courseId, chapterId]);

    const handleCompletion = async () => {
        if (isCompleted) return;
        if (!userId || !chapterId) {
            toast.error("Nie można ukończyć rozdziału: Brak ID użytkownika lub rozdziału.");
            return;
        }

        try {
            const res = await fetch(`/api/module/${chapterId}/complete?providerId=${userId}`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const errorData = await res.text();
                throw new Error(`Nie udało się oznaczyć rozdziału jako ukończony: ${errorData || res.statusText}`);
            }

            setIsCompleted(true);
            toast.success("Rozdział ukończony!");
            router.refresh();

        } catch (error: any) {
            console.error("Completion Error:", error);
            toast.error(error.message || "Nie udało się oznaczyć rozdziału jako ukończony.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-orange-700" size={32} />
            </div>
        );
    }

    if (error) {
        if (error === "Brak dostępu. Skontaktuj się z nauczycielem, aby uzyskać dostęp do tego kursu.") {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    {!hasUserCourse ? (
                        <button
                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
                                        method: 'POST',
                                        body: JSON.stringify({ courseId, userId }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    if (res.ok) {
                                        toast.success("Poproszono o dostęp. Poczekaj na aktywację przez nauczyciela.");
                                        setError("Poproszono o dostęp. Poczekaj na aktywację przez nauczyciela.");
                                    } else {
                                        toast.error("Nie udało się wysłać prośby o dostęp.");
                                    }
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Poproś o dostęp"}
                        </button>
                    ) : (
                        <p className="text-lg text-orange-700">Skontaktuj się z nauczycielem.</p>
                    )}
                    <Link href={`/`} className="mt-4 text-blue-500 hover:underline">
                        Wróć do panelu kursów
                    </Link>
                </div>
            );
        }
        // Default error fallback
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-lg text-red-600">Przepraszamy. Wystąpił błąd. Spróbuj ponownie później.</p>
                <Link href={`/`} className="mt-4 text-blue-500 hover:underline">
                    Wróć do panelu kursów
                </Link>
            </div>
        );
    }

    if (!chapterData) {
        return <div className="p-4">Nie znaleziono danych rozdziału.</div>;
    }

    return (
        <div>
            {isCompleted && (
                <Banner variant="success" label="Rozdział ukończony" />
            )}
            <Link
                href={"/"}
                className="flex items-center text-sm hover:opacity-75 transition p-4 select-none">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Wróć do panelu kursów
            </Link>
            <div className="flex flex-col mx-auto">
                <h1 className="text-2xl font-semibold text-center p-2">{chapterData.module.title}</h1>
                <div className="p-4">
                    <ChapterContent
                        isCompleted={isCompleted}
                        moduleId={chapterData.module.id}
                        onCompleted={handleCompletion}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
