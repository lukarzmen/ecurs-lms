import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import ChapterTitleForm from "./_components/chapter-title-form";
import { ModulePublicationSchedule } from "./_components/module-publication-schedule";
import { SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";


const ChapterEditPage = async ({ params }: { params: Promise<{ courseId: string; chapterId: string }> }) => {
  const { userId } = await auth();
  if (!userId) {
    return (
      <SignedOut>
        <div className="p-6">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Zaloguj się, aby edytować treści</h1>
            <p className="text-gray-600">
              Po zalogowaniu możesz edytować moduły, planować publikację i zarządzać zawartością kursu.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/sign-in">Zaloguj się</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Załóż konto</Link>
              </Button>
            </div>
          </div>
        </div>
      </SignedOut>
    );
  }
  const { courseId, chapterId } = await params;

  const moduleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/module/${chapterId}`);
  let chapterModule = null;
  try {
    chapterModule = await moduleResponse.json();
  } catch (e) {
    chapterModule = null;
  }

  if (!chapterModule) {
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
                    <h1 className="text-2xl font-bold mb-2 mt-4 flex items-center gap-2">
                  <span>✏️ Edytuj treść</span>
                </h1>
            </div>
            <ChapterTitleForm
              chapterId={chapterId}
              title={chapterModule.title}
              courseId={courseId}
            />
          </div>
<div className="w-full">
            <ModulePublicationSchedule 
              courseId={courseId} 
              chapterId={chapterId} 
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
