'use client'; // <-- Make this a Client Component

import { Banner } from "@/components/banner";
import { useAuth } from "@clerk/nextjs"; // <-- Use client-side auth hook
import ChapterContent from "./__components/chapter-content";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useEffect, useState } from "react"; // <-- Import client-side hooks
import { redirect, useParams, useRouter } from "next/navigation"; // <-- Import client-side navigation hooks
import { Loader2 } from "lucide-react";

// Define a type for the fetched chapter data
interface ChapterData {
    module: {
        id: string;
        title: string;
        content: string; // Assuming content is here
        // other module fields...
    };
    course: {
        id: string;
        // other course fields...
    };
    userModule: {
        isFinished: boolean;
        // other userModule fields...
    } | null; // UserModule might not exist initially
}

const ChapterIdPage = () => {
    const { userId } = useAuth(); // Get providerId from client hook
    const params = useParams(); // Get route params
    const router = useRouter(); // Get router for refresh

    const courseId = params.courseId as string;
    const chapterId = params.chapterId as string; // This is the moduleId

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chapterData, setChapterData] = useState<ChapterData | null>(null);
    const [isCompleted, setIsCompleted] = useState(false); // Local state for completion status

    useEffect(() => {
        // Fetch data only if userProviderId and params are available
        if (!userId || !courseId || !chapterId) {
            if (!courseId || !chapterId) setError("Nieprawidłowe parametry trasy.");
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Check Permissions (use GET instead of POST)
                const permResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/permissions?courseId=${courseId}&userId=${userId}`,
                    { method: 'GET' }
                );

                if (!permResponse.ok) {
                    throw new Error("Sprawdzanie uprawnień nie powiodło się. Spróbuj ponownie później.");
                }

                const permResult = await permResponse.json();

                if (!permResult.hasAccess) {
                    throw new Error("Brak dostępu. Skontaktuj się z nauczycielem, aby uzyskać dostęp do tego kursu.");
                }

                // 2. Fetch Chapter Data (including user progress)
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
                setError(err.message || "Wystąpił błąd podczas ładowania rozdziału.");
            } finally {
                setIsLoading(false);
                router.refresh();
            }
        };

        fetchData();

    }, [userId, courseId, chapterId, router]); // Dependencies for useEffect

    // Handler function to be called by ChapterContent
    const handleCompletion = async () => {
        if(isCompleted){
            return; 
        }
        if (!userId || !chapterId) {
            toast.error("Nie można ukończyć rozdziału: Brak ID użytkownika lub rozdziału.");
            return;
        }

        try {
            // Make the PATCH request
            const res = await fetch(`/api/module/${chapterId}/complete?providerId=${userId}`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const errorData = await res.text();
                // Use a more specific error message if possible
                throw new Error(`Nie udało się oznaczyć rozdziału jako ukończony: ${errorData || res.statusText}`);
            }

            // Success: Update local state and show toast
            setIsCompleted(true);
            toast.success("Rozdział ukończony!");

            router.refresh();

        } catch (error: any) {
            console.error("Completion Error:", error);
            toast.error(error.message || "Nie udało się oznaczyć rozdziału jako ukończony.");
            // Optionally revert local state if needed: setIsCompleted(false);
        }
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full mt-16">
                <Loader2 className="animate-spin text-orange-700" size={32} />
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
             <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-lg text-red-600">Błąd: {error}</p>
                <Link href={`/`} className="mt-4 text-blue-500 hover:underline">
                    Wróć do panelu kursów
                </Link>
            </div>
        );
    }

    // Render chapter content if data is loaded
    if (!chapterData) {
         return <div className="p-4">Nie znaleziono danych rozdziału.</div>; // Should ideally be caught by error state
    }

    return (
        <div>
            {/* Display banner based on the LOCAL isCompleted state */}
            {isCompleted && (
                <Banner variant="success" label="Rozdział ukończony" />
            )}
            <Link
                href={"/"} // Link back to the course page
                className="flex items-center text-sm hover:opacity-75 transition p-4 select-none">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Wróć do panelu kursów
            </Link>
            <div className="flex flex-col mx-auto">
                <h1 className="text-2xl font-semibold text-center p-2">{chapterData.module.title}</h1>
                <div className="p-4">
                    {/* Pass content and the completion handler */}
                    <ChapterContent
                        isCompleted={isCompleted} // Pass the local completion state
                        moduleId={chapterData.module.id} // Pass the actual content
                        onCompleted={handleCompletion} // Pass the handler function
                    />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
