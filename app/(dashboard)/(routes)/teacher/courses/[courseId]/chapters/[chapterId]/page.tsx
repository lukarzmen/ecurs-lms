import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Eye, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import ChapterAccessForm from "./_components/chapter-access-form";
import { Banner } from "@/components/banner";
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
    return redirect("/");
  }

  const chapter = await db.chapter.findFirst({
    where: {
      id: params.chapterId,
      courseId: params.courseId,
    },
    include: {
      muxData: true,
    },
  });

  if (!chapter) {
    redirect("/");
  }

  const requiredFields = [chapter.title, chapter.description];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `${completedFields}/${totalFields}`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="This is unpublished. It will be not visible in the course"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/courses/${params.courseId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2"></ArrowLeft>
              Back to course setup
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-medium">Lesson edit</h1>
                <span className="text-sm text-sl text-slate-700">
                  Complete all fields {completionText}
                </span>
              </div>
              <ChapterActions
                disabled={!isComplete}
                courseId={params.courseId}
                chapterId={params.chapterId}
                isPublished={chapter.isPublished}
              ></ChapterActions>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Create your lesson content</h2>
            </div>
            <ChapterTitleForm
              chapterId={chapter.id}
              title={chapter.title}
              courseId={params.courseId}
            />
         
          </div>
          <div className="space-y-4">
          <div className="flex items-center gap-x-2">
            <IconBadge icon={Eye} />
            <h2 className="text-xl">Access settings</h2>
          </div>
          <ChapterAccessForm
            chapterId={chapter.id}
            courseId={params.courseId}
            isFree={!!chapter.isFree}
          />
        </div>
    
        </div>
        
        <ChapterDescriptionForm
              chapterId={chapter.id}
              description={chapter.description ?? ""}
              courseId={params.courseId}
            />
      </div>
    </>
  );
};

export default ChapterEditPage;
