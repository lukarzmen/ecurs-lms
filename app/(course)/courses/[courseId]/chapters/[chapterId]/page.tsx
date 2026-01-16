'use client'; // <-- Make this a Client Component

import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs"; // <-- Use client-side auth hook
import ChapterContent from "./__components/chapter-content";
import { ArrowLeft, Hourglass } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useEffect, useState } from "react"; // <-- Import client-side hooks
import { redirect, useParams, useRouter } from "next/navigation"; // <-- Import client-side navigation hooks
import { Loader2 } from "lucide-react";
import type { ExportHandlers } from "@/components/editor/plugins/ExportBridgePlugin";

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
        title: string;
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
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [chapterData, setChapterData] = useState<ChapterData | null>(null);
    const [isCompleted, setIsCompleted] = useState(false); // Local state for completion status
    const [isCompleting, setIsCompleting] = useState(false); // Prevent double completion
    const [exportHandlers, setExportHandlers] = useState<ExportHandlers | null>(null);

    useEffect(() => {
        // Fetch data only if userProviderId and params are available
        if (!userId || !courseId || !chapterId) {
            if (!courseId || !chapterId) setError("Nieprawidłowe parametry trasy.");
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setLoadingMessage(null);
            try {
                const permissionsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/permissions?courseId=${courseId}&userId=${userId}`;

                const readPendingAccessTs = (): number | null => {
                    try {
                        const raw = window.localStorage.getItem(`ecurs:pending-course-access:${courseId}`);
                        if (!raw) return null;
                        const parsed = JSON.parse(raw);
                        const ts = typeof parsed?.ts === 'number' ? parsed.ts : null;
                        return ts;
                    } catch {
                        return null;
                    }
                };

                const clearPendingAccess = () => {
                    try {
                        window.localStorage.removeItem(`ecurs:pending-course-access:${courseId}`);
                    } catch {
                        // Non-blocking
                    }
                };

                const checkPermissionsOnce = async () => {
                    const permResponse = await fetch(permissionsUrl, { method: 'GET', cache: 'no-store' });
                    if (!permResponse.ok) {
                        throw new Error("Sprawdzanie uprawnień nie powiodło się. Spróbuj ponownie później.");
                    }
                    return await permResponse.json();
                };

                // 1. Check Permissions
                let permResult = await checkPermissionsOnce();

                // If access is missing but we recently completed checkout, retry briefly.
                if (!permResult.hasAccess) {
                    const pendingTs = readPendingAccessTs();
                    const pendingWindowMs = 10 * 60 * 1000; // 10 minutes
                    const isPending = pendingTs ? (Date.now() - pendingTs) < pendingWindowMs : false;

                    if (isPending) {
                        setLoadingMessage("Potwierdzamy płatność i aktywujemy dostęp do kursu…");

                        const startedAt = Date.now();
                        const maxWaitMs = 35_000;
                        const pollEveryMs = 1_200;

                        while (!permResult.hasAccess && (Date.now() - startedAt) < maxWaitMs) {
                            await new Promise((r) => setTimeout(r, pollEveryMs));
                            permResult = await checkPermissionsOnce();
                        }

                        if (permResult.hasAccess) {
                            clearPendingAccess();
                        }
                    }
                }

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
        if (isCompleted || isCompleting) {
            return;
        }
        if (!userId || !chapterId) {
            toast.error("Nie można ukończyć rozdziału: Brak ID użytkownika lub rozdziału.");
            return;
        }
        setIsCompleting(true);
        try {
            // Make the PATCH request
            const res = await fetch(`/api/module/${chapterId}/complete?providerId=${userId}`, {
                method: 'PATCH',
            });

            if (!res.ok) {
                const errorData = await res.text();
                
                // Handle specific error codes with user-friendly messages
                if (res.status === 403) {
                    if (errorData.includes('Module is not active')) {
                        toast.error("Ten moduł nie jest jeszcze aktywny.");
                    } else if (errorData.includes('No active access')) {
                        toast.error("Brak aktywnego dostępu do tego kursu.");
                    } else {
                        toast.error("Brak uprawnień do ukończenia tego modułu.");
                    }
                } else if (res.status === 400) {
                    toast.error("Ten moduł nie ma jeszcze treści do ukończenia.");
                } else if (res.status === 404) {
                    toast.error("Nie znaleziono modułu lub nie masz do niego dostępu.");
                } else {
                    toast.error(`Nie udało się oznaczyć rozdziału jako ukończony: ${errorData || res.statusText}`);
                }
                return;
            }

            // Success: Update local state and show toast
            setIsCompleted(true);
            toast.success("Rozdział ukończony!");

            // Delay router.refresh to avoid immediate re-render
            setTimeout(() => {
                router.refresh();
            }, 300);

        } catch (error: any) {
            console.error("Completion Error:", error);
            toast.error(error.message || "Nie udało się oznaczyć rozdziału jako ukończony.");
        } finally {
            setIsCompleting(false);
        }
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full mt-16">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-orange-700" size={32} />
                    {loadingMessage && (
                        <p className="text-sm text-gray-600 text-center max-w-md px-4">{loadingMessage}</p>
                    )}
                </div>
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
            <div className="flex items-center justify-between gap-2 p-4">
                <Link
                    href={"/"} // Link back to the course page
                    className="flex items-center text-sm hover:opacity-75 transition select-none">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Wróć do panelu kursów
                </Link>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!exportHandlers}
                        onClick={() => exportHandlers?.exportHtml()}>
                        Pobierz HTML
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!exportHandlers}
                        onClick={() => exportHandlers?.exportPdf()}>
                        Pobierz PDF
                    </Button>
                </div>
            </div>
            <div className="flex flex-col mx-auto">
                <h1 className="text-2xl font-semibold text-center p-2">{chapterData.module.title}</h1>
                <div className="p-4">
                    {/* Pass content and the completion handler */}
                    <ChapterContent
                        isCompleted={isCompleted}
                        moduleId={chapterData.module.id}
                        onCompleted={handleCompletion}
                        isCompleting={isCompleting}
                        onExportReady={setExportHandlers}
                        module={{
                            courseId,
                            courseName: chapterData.course.title,
                            moduleId: chapterData.module.id,
                            moduleName: chapterData.module.title,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChapterIdPage;
