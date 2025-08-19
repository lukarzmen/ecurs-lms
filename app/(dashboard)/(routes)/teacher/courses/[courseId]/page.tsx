import React from "react";
import { ShareDialog } from "./_components/share-dialog";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TitleForm from "./_components/title-form";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import CategoryForm from "./_components/category-form";
import ChaptersForm from "./_components/chapters-form";
import Link from "next/link";
import { Category } from "@prisma/client";
import { StudentsForm } from "./_components/students-form";
import CourseModeForm from "./_components/mode_form";
import PriceForm from "./_components/price-form";
import CourseStateBar from "./_components/state-bar";
import { PromoCodesForm } from "./_components/promo-codes-form";

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = await auth() ?? "";
  if (!userId) {
    return redirect("/sign-in");
  }
  const { courseId } = await params;
  const courseIdNumber = parseInt(courseId, 10);

  const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}?showDrafts=true`);
  const course = await coursesResponse.json();
  const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
  const categories = await categoriesResponse.json();
  if (!course) {
    return <div>Kurs nie znaleziony</div>;
  }

  const courseTitle = course.title;
  const { mode, state } = course;

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <Link
              href="/teacher/courses"
              className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Powrót do listy kursów
            </Link>

          </div>
        </div>
        <>
                    <div className="flex items-center mb-2 mt-4 gap-2 w-full">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>📝 Informacje o kursie</span>
              </h1>
              <div className="flex-1" />
              <div className="flex justify-end">
                <ShareDialog
                  courseIdNumber={courseIdNumber}
                  apiUrl={process.env.NEXT_PUBLIC_API_URL || ''}
                />
              </div>
            </div></>
        <>
          <div className="w-full">
            <CourseStateBar courseId={courseId} mode={mode} state={state} />
          </div>
        </>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TitleForm title={courseTitle} courseId={courseId} />
          <DescriptionForm description={course.description ?? ''} courseId={courseId} />
          <CategoryForm
            categoryId={course.categoryId ?? -1}
            options={categories.map((x: Category) => ({
              label: x.name,
              value: x.id,
              key: x.id,
            }))}
            courseId={courseIdNumber}
          />
          <CourseModeForm courseId={courseId} mode={course.mode ?? 0}/>
          <ImageForm imageId={course.imageId ?? ''} courseId={courseId} />
          <PriceForm price={course.price ?? 0} courseId={courseId} />
        </div>
        <div className="space-y-6 ">
          <div>
            <div className="flex items-center gap-x-2 gap-6 mt-6">
              <span className="text-xl">📚</span>
              <h2 className="text-xl">Lekcje</h2>
            </div>
            <div>
              <ChaptersForm chapters={course.modules} courseId={courseId} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-x-2 gap-6 mt-6">
                <span className="text-xl">🏷️</span>
                <h2 className="text-xl">Kody promocyjne</h2>
            </div>
            <div>
              <PromoCodesForm courseId={courseId} />
            </div>
          </div>
          <div className="flex items-center gap-x-2 gap-6 mt-6">
            <span className="text-xl">👥</span>
            <h2 className="text-xl">Uczestnicy</h2>
          </div>
          <StudentsForm courseId={courseId} />
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
