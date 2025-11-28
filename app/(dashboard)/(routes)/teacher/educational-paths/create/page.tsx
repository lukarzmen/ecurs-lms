"use client";
import { useState, useEffect } from "react";
import Combobox from "@/components/ui/combobox";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, X, Loader2, BookMarked, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl w-full mx-auto flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teacher/educational-paths"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition mb-4 select-none gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do listy ścieżek
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            📚 Utwórz ścieżkę edukacyjną
          </h1>
          <p className="text-muted-foreground mt-2">
            Połącz wiele kursów w logiczną sekwencję nauki dla uczniów
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Section */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <BookMarked className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Tytuł powinien być wyraźny i opisywać cel nauki. To będzie pierwszy kontakt ucznia ze ścieżką.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tytuł ścieżki edukacyjnej
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="np. 'Fundamenty programowania web'"
                    className="border-2 text-base py-2.5"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {title.length}/100 znaków
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Opisz, jakie umiejętności uczniowie zdobędą oraz jaki jest cel tej ścieżki.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Opis ścieżki
                  </label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="np. 'Ta ścieżka obejmuje wszystko, co potrzebujesz, aby zacząć programować aplikacje web...'"
                    className="border-2 resize-none min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {description.length}/500 znaków
                  </p>
                </div>
              </div>

              {/* Courses Selection */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <BookMarked className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Dodaj kursy w kolejności, w której uczniowie powinni je ukończyć. Kolejność jest ważna!
                  </p>
                </div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Wybrane kursy ({selectedCourses.length})
                </label>
                {coursesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ładowanie kursów...
                  </div>
                ) : (
                  <>
                    {selectedCourses.length > 0 && (
                      <div className="space-y-2 mb-4 p-4 bg-muted/30 rounded-lg border border-border">
                        {selectedCourses.map((courseId, index) => {
                          const course = courses.find(c => c.id === courseId);
                          if (!course) return null;
                          return (
                            <div key={courseId} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium text-foreground">{course.title}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition"
                                onClick={() => setSelectedCourses(selectedCourses.filter(id => id !== courseId))}
                                aria-label="Usuń kurs"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Dodaj kurs
                      </label>
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
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/teacher/educational-paths")}
                  disabled={isSubmitting}
                >
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title || selectedCourses.length === 0}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : null}
                  {isSubmitting ? 'Tworzenie...' : 'Utwórz ścieżkę'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEducationalPathPage;
