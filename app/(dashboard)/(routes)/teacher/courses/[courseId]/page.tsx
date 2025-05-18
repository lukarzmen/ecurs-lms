import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/icon-badge";
import { ArrowLeft, LayoutDashboard, ListCheck, PlusCircle, Settings, Users2Icon } from "lucide-react";
import TitleForm from "./_components/title-form";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import CategoryForm from "./_components/category-form";
import ChaptersForm from "./_components/chapters-form";
import Link from "next/link";
import { Category } from "@prisma/client";
import { StudentsForm } from "./_components/students-form";

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = auth() ?? "";
  if (!userId) {
    return redirect("/sign-in");
  }
  const { courseId } = await params;
  const courseIdNumber = parseInt(courseId, 10);

  let course, categories;
  let fetchError: string | null = null;

  try {
    const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`);
    if (!coursesResponse.ok) throw new Error();
    course = await coursesResponse.json();

    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
    if (!categoriesResponse.ok) throw new Error();
    categories = await categoriesResponse.json();
  } catch (error) {
    fetchError = "Przepraszamy. Wystąpił błąd. Spróbuj ponownie później.";
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">Błąd!</span> {fetchError}
        </div>
        <Link
          href="/teacher/courses"
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
        >
          Wróć do listy kursów
        </Link>
      </div>
    );
  }

  if (!course) {
    return <div>Kurs nie znaleziony</div>;
  }

  const requiredFields = [
    course.title,
    course.description,
    course.categoryId,
    course.modules,
  ];


  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `${completedFields}/${totalFields}`;
  const courseTitle = course.title;

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
            <h1 className="text-2xl font-medium">Konfiguracja kursu</h1>

            <span className="text-sm text-slate-800">Wypełnij wszystkie pola {completionText}</span>
          </div>
        </div>
        <div className="flex items-center gap-x-2 mt-8">
              <IconBadge icon={Settings} />
              <h2 className="text-xl">Dostosuj swój kurs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TitleForm title={courseTitle} courseId={courseId} />
          <CategoryForm
            categoryId={course.categoryId ?? -1}
            options={categories.map((x: Category) => ({
              label: x.name,
              value: x.id,
              key: x.id,
            }))}
            courseId={courseIdNumber}
          />
          <ImageForm imageId={course.imageId ?? ''} courseId={courseId} />
          <DescriptionForm description={course.description ?? ''} courseId={courseId} />

        </div>
        <div className="space-y-6 ">
          <div>
            <div className="flex items-center gap-x-2 gap-6 mt-6">
              <IconBadge icon={ListCheck} />
              <h2 className="text-xl">Lekcje</h2>
            </div>
            <div>
              <ChaptersForm chapters={course.modules} courseId={courseId} />
            </div>
          </div>
          <div className="flex items-center gap-x-2 gap-6 mt-6">
            <IconBadge icon={Users2Icon} />
            <h2 className="text-xl">Uczestnicy</h2>
          </div>
          <StudentsForm courseId={courseId} />
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
