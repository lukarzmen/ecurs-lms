"use client";
import { useEffect, useState } from "react";
import ImageForm from "./_components/image-form";
import EducationalPathStateBar from "./_components/state-bar";
import PriceForm from "./_components/price-form";
import CategoryForm from "./_components/category-form";
import EduPathModeForm from "./_components/mode_form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PromoCodesForm } from "./_components/promo-codes-form";
import { useParams } from "next/navigation";

const EducationalPathDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: pathId } = React.use(params);
  const [path, setPath] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageId, setImageId] = useState<string>("");
  const {userId} = useAuth();
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/educational-paths/${pathId}?userId=${userId}`);
        const data = await res.json();
        setPath(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setImageId(data.imageId ?? "");
        setCourses(data.courses ?? []);
        // Fetch all teacher's courses for adding (use userId)
        if (userId) {
          const allRes = await fetch(`/api/courses?userId=${userId}`);
          const allData = await allRes.json();
          setAllCourses(allData);
        } else {
          setAllCourses([]);
        }
        // Fetch categories
        const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch {
        toast.error("Nie udało się pobrać szczegółów ścieżki");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [pathId, userId]);

  const handleTitleSave = async () => {
    try {
      const res = await fetch(`/api/educational-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      toast.success("Zaktualizowano nazwę ścieżki");
      setEditTitle(false);
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  const handleDescriptionSave = async () => {
    try {
      const res = await fetch(`/api/educational-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      toast.success("Zaktualizowano opis ścieżki");
      setEditDescription(false);
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  const handleCourseRemove = async (courseId: number) => {
    try {
      const res = await fetch(`/api/educational-paths/${pathId}/courses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: courseId }),
      });
      if (!res.ok) throw new Error();
      setCourses(courses.filter((c) => c.courseId !== courseId));
      toast.success("Usunięto kurs ze ścieżki");
    } catch {
      toast.error("Nie udało się usunąć kursu");
    }
  };

  const handleCourseAdd = async (courseId: number) => {
    try {
      const res = await fetch(`/api/educational-paths/${pathId}/courses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: courseId }),
      });
      if (!res.ok) throw new Error();
      setCourses([...courses, allCourses.find((c) => c.id === courseId)]);
      toast.success("Dodano kurs do ścieżki");
    } catch {
      toast.error("Nie udało się dodać kursu");
    }
  };

  const handleReorder = async (from: number, to: number) => {
    if (to < 0 || to >= courses.length) return;
    const reordered = [...courses];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setCourses(reordered);
    try {
      const res = await fetch(`/api/educational-paths/${pathId}/courses`, {
        method: "PATCH",
    headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((c) => c.courseId) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Zmieniono kolejność kursów");
    } catch {
      toast.error("Nie udało się zmienić kolejności");
    }
  };

  if (loading || !path) return (
    <div className="p-6">
      <div className="flex justify-center items-center mt-8">
        <Loader2 className="animate-spin text-orange-700" size={32} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/teacher/educational-paths"
          className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Powrót do listy ścieżek
        </Link>
        <Link href="/teacher/courses/create">
          <Button className="mt-4" variant="default">Utwórz nowy kurs</Button>
        </Link>
      </div>

      {/* State bar for educational path */}
      <div className="w-full">
        <EducationalPathStateBar educationalPathId={pathId} mode={path?.mode ?? 0} state={path?.state ?? 0} />
      </div>
      {/* Title and description in one row, but description has its own section */}
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {/* Title card */}
        <div className="md:w-1/2 w-full">
          <div className="mt-6 border bg-orange-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between mb-2">
              <span className="flex items-center gap-2"><span className="text-2xl">🛤️</span>Tytuł</span>
              <Button onClick={() => setEditTitle((v) => !v)} variant="ghost">
                {editTitle ? "Anuluj" : <><span className="mr-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>Edytuj</>}
              </Button>
            </div>
            {editTitle ? (
              <div className="space-y-4 mt-4">
                <Input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-base" />
                <div className="flex items-center gap-x-2">
                  <Button onClick={handleTitleSave} disabled={!title.trim()} type="button">Zapisz</Button>
                </div>
              </div>
            ) : (
              <p className="text-base mt-2">{title}</p>
            )}
          </div>
        </div>
        {/* Description card */}
        <div className="md:w-1/2 w-full">
          <div className="mt-6 border bg-orange-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between mb-2">
              <span className="flex items-center gap-2"><span className="text-lg">📝</span>Opis</span>
              <Button onClick={() => setEditDescription((v) => !v)} variant="ghost">
                {editDescription ? "Anuluj" : <><span className="mr-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>Edytuj</>}
              </Button>
            </div>
            {editDescription ? (
              <div className="space-y-4 mt-4">
                <Input value={description} onChange={e => setDescription(e.target.value)} className="w-full text-base" />
                <div className="flex items-center gap-x-2">
                  <Button onClick={handleDescriptionSave} disabled={description === undefined} type="button">Zapisz</Button>
                </div>
              </div>
            ) : (
              <p className="text-base mt-2">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* New row for price-form and category-form */}
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        <div className="md:w-1/2 w-full">
          {/* Replace with actual price data and pathId as needed */}
          <PriceForm price={path?.price ?? { amount: 0, currency: "PLN" }} educationalPathId={pathId} />
        </div>
        <div className="md:w-1/2 w-full">
          <CategoryForm
            categoryId={path?.categoryId ?? 0}
            id={Number(pathId)}
            options={categories.map((cat: any) => ({ label: cat.name, value: cat.id }))}
            onCategoryChange={catId => setPath((prev: any) => ({ ...prev, categoryId: catId }))}
          />
        </div>
      </div>


    <div className="flex flex-col md:flex-row gap-8 mb-12">
      <div className="md:w-1/2 w-full">
        <ImageForm
          imageId={imageId}
          educationalPathId={pathId}
          onImageChange={imgId => setImageId(imgId)}
        />
      </div>
      <div className="md:w-1/2 w-full">
        <EduPathModeForm educationalPathId={pathId} mode={path?.mode ?? 0} />
      </div>
    </div>

      <div className="border bg-orange-100 rounded-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📚</span>
          <h2 className="text-xl font-semibold">Kursy w ścieżce</h2>
        </div>
        <ul className="space-y-2 mb-4">
          {courses.map((course, idx) => (
            <li key={course.courseId ?? idx} className="flex items-center gap-2 bg-orange-50 rounded p-2 border">
              <Link href={`/teacher/courses/${course.courseId}`} className="font-medium text-blue-700 hover:underline">
                {course.title}
              </Link>
              <Button size="sm" variant="ghost" onClick={() => handleReorder(idx, idx - 1)} disabled={idx === 0}>↑</Button>
              <Button size="sm" variant="ghost" onClick={() => handleReorder(idx, idx + 1)} disabled={idx === courses.length - 1}>↓</Button>
              <Button size="sm" variant="destructive" onClick={() => handleCourseRemove(course.courseId)}>Usuń</Button>
            </li>
          ))}
        </ul>
        {/* Add course UX */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">➕</span>
            <h3 className="font-semibold">Dodaj kurs do ścieżki</h3>
          </div>
          <div className="flex gap-2">
            <select
              className="border rounded p-2 w-full"
              id="add-course-select"
              defaultValue=""
            >
              <option value="" disabled>Wybierz kurs</option>
              {allCourses.filter(c => !courses.some(cc => cc.courseId === c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => {
                const select = document.getElementById("add-course-select") as HTMLSelectElement;
                if (select && select.value) {
                  handleCourseAdd(Number(select.value));
                  select.value = "";
                }
              }}
              disabled={allCourses.filter(c => !courses.some(cc => cc.courseId === c.id)).length === 0}
            >Dodaj</Button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Zarządzaj kodami promocyjnymi</h2>
        <PromoCodesForm educationalPathId={pathId} />
      </div>
    </div>
  );
};

export default EducationalPathDetailsPage;
