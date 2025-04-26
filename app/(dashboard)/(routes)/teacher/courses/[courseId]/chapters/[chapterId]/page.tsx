import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";

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
  const { courseId, chapterId } = await params;

  const moduleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/module/${chapterId}`);
  const module = await moduleResponse.json(); 

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
              className="flex items-center text-sm hover:opacity-75 transition p-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2"></ArrowLeft>
              Wróć do konfiguracji kursu
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full">
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
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
