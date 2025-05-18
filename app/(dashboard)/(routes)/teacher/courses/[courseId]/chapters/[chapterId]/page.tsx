import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Text } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import React from "react";

const ChapterEditPage = async ({
  params,
}: {
  params: {
    courseId: string;
    chapterId: string;
  };
}) => {
  const { userId } = auth() ?? "";
  if (!userId) {
    return redirect("/sign-in");
  }
  const { courseId, chapterId } = params;

  let module = null;
  let fetchError: string | null = null;

  try {
    const moduleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/module/${chapterId}`
    );
    if (!moduleResponse.ok) throw new Error();
    module = await moduleResponse.json();
  } catch (error) {
    fetchError = "Przepraszamy. Wystąpił błąd. Spróbuj ponownie później.";
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <span className="font-medium">Błąd!</span> {fetchError}
        </div>
        <Link
          href={`/teacher/courses/${courseId}`}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
        >
          Wróć do konfiguracji kursu
        </Link>
      </div>
    );
  }

  if (!module) {
    redirect("/");
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/courses/${courseId}`}
              className="flex items-center text-sm hover:opacity-75 transition pt-4 pb-4 select-none"
            >
              <ArrowLeft className="h-4 w-4 mr-1"></ArrowLeft>
              Wróć do konfiguracji kursu
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full">
            <div className="flex items-center gap-x-2">
              <IconBadge icon={Text} />
              <h2 className="text-xl">Stwórz treść swojej lekcji</h2>
            </div>
            <ChapterTitleForm
              chapterId={chapterId}
              title={module.title}
              courseId={courseId}
            />
          </div>

          <div className="w-full">
            <ChapterDescriptionForm
              chapterId={chapterId}
              courseId={courseId}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterEditPage;
