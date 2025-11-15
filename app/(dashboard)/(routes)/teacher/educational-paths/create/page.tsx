"use client";
import { useState, useEffect } from "react";
import Combobox from "@/components/ui/combobox";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


const CreateEducationalPathPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    // Fetch teacher's courses using userId from useAuth
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        if (userId) {
          const coursesRes = await fetch(`/api/courses?userId=${userId}`);
          const coursesData = await coursesRes.json();
          setCourses(coursesData);
        } else {
          setCourses([]);
        }
      } catch (error) {
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!userId) throw new Error("Brak użytkownika");
      const res = await fetch("/api/educational-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          courseIds: selectedCourses,
          userProviderId: userId,
        }),
      });
      if (!res.ok) throw new Error("Błąd tworzenia ścieżki edukacyjnej");
      const data = await res.json();
      toast.success("Ścieżka edukacyjna utworzona!");
      router.push(`/teacher/educational-paths/${data.id}`);
    } catch (error) {
      toast.error("Coś poszło nie tak");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl py-8 ml-8 mr-8">
      <Link
        href="/teacher/educational-paths"
        className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Wróć do listy ścieżek
      </Link>
      <h1 className="text-2xl font-bold mb-6">Utwórz ścieżkę edukacyjną</h1>
      <Card className="mb-8">
        <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tytuł</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Opis</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wybierz kursy</label>
            {coursesLoading ? (
              <div className="mt-2 text-sm text-gray-500">Ładowanie kursów...</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCourses.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    if (!course) return null;
                    return (
                      <span key={courseId} className="inline-flex items-center bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm">
                        {course.title}
                        <button
                          type="button"
                          className="ml-1 text-slate-500 hover:text-slate-700"
                          onClick={() => setSelectedCourses(selectedCourses.filter(id => id !== courseId))}
                          aria-label="Usuń kurs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <Combobox
                  options={courses
                    .filter(c => !selectedCourses.includes(c.id))
                    .map(c => ({ label: c.title, value: String(c.id) }))}
                  value={""}
                  onChange={val => {
                    if (val) {
                      setSelectedCourses([...selectedCourses, Number(val)]);
                    }
                  }}
                />
              </>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Tworzenie..." : "Utwórz ścieżkę edukacyjną"}
          </Button>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEducationalPathPage;
