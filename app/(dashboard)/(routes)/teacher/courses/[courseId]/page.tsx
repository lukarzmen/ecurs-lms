import React, {  } from "react";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import { LayoutDashboard, ListCheck } from "lucide-react";
import TitleForm from "./_components/title-form";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import CategoryForm from "./_components/category-form";
import ChaptersForm from "./_components/chapters-form";
import { Actions } from "./_components/actions";

const CourseIdPage = async ({ params }) => {
  const { userId } = auth() ?? "";
  if (!userId) {
    return redirect("/sign-in");
  }
  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: parseInt(courseId), userId: userId },
    include: {
      modules: { orderBy: { position: "asc" } }
    },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  if (!course) {
    return <div>Course not found</div>;
  }

  const requiredFields = [
    course.title,
    course.description,
    course.categoryId,
    course.modules,
  ];

  console.debug(course);
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `${completedFields}/${totalFields}`;
  const courseTitle = course.title;


  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">Course setup</h1>
            <span className="text-sm text-slate-800">Complete all fields {completionText}</span>
          </div>
          <Actions courseId={courseId} />
        </div>
        <div className="flex items-center gap-x-2 mt-8">
          <IconBadge icon={LayoutDashboard} />
          <h2 className="text-xl">Customize your course</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TitleForm title={courseTitle} courseId={courseId} />
          <DescriptionForm description={course.description ?? ''} courseId={courseId} />
          <ImageForm imageId={course.imageId ?? ''} courseId={courseId} />
          <CategoryForm
            categoryId={course.categoryId ?? ''}
            options={categories.map((x) => ({
            label: x.name,
              value: x.id,
              key: x.id,
            }))}
            courseId={courseId}
          />
        </div>
        <div className="space-y-6 ">
          <div>
            <div className="flex items-center gap-x-2 gap-6 mt-6">
              <IconBadge icon={ListCheck} />
              <h2 className="text-xl">Modules</h2>
            </div>
            <div>
              <ChaptersForm chapters={course.modules} courseId={courseId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
