'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProcessingState =
  | { status: "waiting"; message?: string }
  | { status: "timeout"; message: string }
  | { status: "error"; message: string };

export function CoursePaymentProcessing(props: { courseId: string; userId: string }) {
  const { courseId, userId } = props;
  const router = useRouter();
  const [state, setState] = useState<ProcessingState>({
    status: "waiting",
    message: "Potwierdzamy płatność i aktywujemy dostęp do kursu…",
  });

  const finishedRef = useRef(false);

  useEffect(() => {
    if (!courseId || !userId) {
      setState({ status: "error", message: "Brak danych do weryfikacji płatności." });
      return;
    }

    // Mark that we expect access to appear soon (webhook is async).
    try {
      window.localStorage.setItem(
        `ecurs:pending-course-access:${courseId}`,
        JSON.stringify({ ts: Date.now() }),
      );
    } catch {
      // Non-blocking (e.g. storage disabled)
    }

    const startedAt = Date.now();
    const maxWaitMs = 35_000;
    const pollEveryMs = 1_200;

    const checkAccessOnce = async () => {
      if (finishedRef.current) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed > maxWaitMs) {
        finishedRef.current = true;
        setState({
          status: "timeout",
          message:
            "Płatność jest jeszcze przetwarzana. Odśwież stronę za chwilę lub wróć do kursu i spróbuj ponownie.",
        });
        return;
      }

      try {
        const permRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/permissions?courseId=${encodeURIComponent(courseId)}&userId=${encodeURIComponent(userId)}`,
          { method: "GET", cache: "no-store" },
        );

        if (!permRes.ok) return;

        const perm = (await permRes.json()) as { hasAccess?: boolean };
        if (!perm?.hasAccess) return;

        // Access granted -> fetch first module and redirect.
        const courseRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${encodeURIComponent(courseId)}/user?userId=${encodeURIComponent(userId)}`,
          { method: "GET", cache: "no-store" },
        );

        if (!courseRes.ok) {
          finishedRef.current = true;
          setState({
            status: "error",
            message: "Dostęp aktywny, ale nie udało się pobrać danych kursu. Spróbuj odświeżyć stronę.",
          });
          return;
        }

        const course = (await courseRes.json()) as { firstNotFinishedModuleId?: number | null };
        const firstModuleId = course?.firstNotFinishedModuleId;

        if (!firstModuleId) {
          finishedRef.current = true;
          setState({
            status: "error",
            message: "Dostęp aktywny, ale nie znaleziono modułów kursu.",
          });
          return;
        }

        finishedRef.current = true;

        try {
          window.localStorage.removeItem(`ecurs:pending-course-access:${courseId}`);
        } catch {
          // Non-blocking
        }

        router.replace(`/courses/${courseId}/chapters/${firstModuleId}?userId=${encodeURIComponent(userId)}`);
      } catch {
        // Ignore and keep polling until timeout.
      }
    };

    // Run immediately, then poll.
    void checkAccessOnce();
    const intervalId = window.setInterval(() => {
      void checkAccessOnce();
    }, pollEveryMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [courseId, router, userId]);

  return (
    <div className="flex justify-center items-center h-full mt-16 p-6">
      <div className="w-full max-w-xl space-y-4">
        <div className="flex items-center gap-3">
          {state.status === "waiting" && <Loader2 className="h-5 w-5 animate-spin" />}
          <h1 className="text-xl font-semibold">Przetwarzanie płatności</h1>
        </div>

        <p className="text-gray-700">
          {state.status === "waiting" ? state.message : state.message}
        </p>

        {state.status !== "waiting" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/courses/${courseId}`}>Wróć do kursu</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Przejdź do panelu</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
