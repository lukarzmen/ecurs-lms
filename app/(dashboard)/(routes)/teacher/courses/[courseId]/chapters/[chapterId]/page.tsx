import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import { ChapterActions } from "../../_components/chapter-actions";

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

  const courseIdInt = parseInt(params.courseId, 10);
  const chapterIdInt = parseInt(params.chapterId, 10);
  const chapter = await db.module.findFirst({
    where: {
      id: chapterIdInt,
      courseId: courseIdInt,
    },
  });

  if (!chapter) {
    redirect("/");
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/courses/${courseId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2"></ArrowLeft>
              Back to course setup
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-full">
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Create your lesson content</h2>
            </div>
            <ChapterTitleForm
              chapterId={chapterId}
              title={chapter.title}
              courseId={courseId}
            />
          </div>

          <div className="w-full">
            <ChapterDescriptionForm
              chapterId={chapterId}
              moduleContentId={chapter.moduleContentId}
              courseId={courseId}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterEditPage;
