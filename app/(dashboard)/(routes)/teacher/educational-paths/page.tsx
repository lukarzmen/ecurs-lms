"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, GraduationCap, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

const EducationalPathsPage = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userId } = useAuth();
  
  const fetchPaths = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/educational-paths?userId=" + userId);
      const data = await res.json();
      setPaths(data);
    } catch (error) {
      toast.error("Nie udało się pobrać ścieżek edukacyjnych");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/educational-paths?userId=" + userId);
        const data = await res.json();
        setPaths(data);
      } catch (error) {
        toast.error("Nie udało się pobrać ścieżek edukacyjnych");
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleDelete = async (id: number) => {
    const confirmWithModal = (): Promise<boolean> =>
      new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "rounded-md p-4";
      dialog.innerHTML = `
        <form method="dialog" class="flex flex-col gap-4">
        <div class="text-lg font-medium">Potwierdź usunięcie</div>
        <div>Czy na pewno chcesz usunąć tę ścieżkę edukacyjną?</div>
        <div class="flex justify-end gap-2">
          <button value="cancel" class="px-3 py-1 rounded bg-gray-200">Anuluj</button>
          <button value="confirm" class="px-3 py-1 rounded bg-red-600 text-white">Usuń</button>
        </div>
        </form>
      `;
      document.body.appendChild(dialog);
      dialog.addEventListener(
        "close",
        () => {
        const confirmed = dialog.returnValue === "confirm";
        dialog.remove();
        resolve(confirmed);
        },
        { once: true }
      );
      // showModal may throw on older browsers, guard defensively
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {
        // fallback to window.confirm if dialog unsupported
        const fallback = window.confirm("Czy na pewno chcesz usunąć tę ścieżkę edukacyjną?");
        dialog.remove();
        resolve(fallback);
      }
      });

    if (!(await confirmWithModal())) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/educational-paths/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ścieżka edukacyjna usunięta");
      setPaths(paths.filter(p => p.id !== id));
    } catch {
      toast.error("Nie udało się usunąć ścieżki edukacyjnej");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter paths based on search term
  const filteredPaths = paths.filter(path =>
    path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-orange-600" />
            <span>Ścieżki edukacyjne</span>
            <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {paths.length}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            Organizuj kursy w spójne ścieżki rozwoju dla swoich studentów
          </p>
        </div>
        <Link href="/teacher/educational-paths/create">
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            <PlusCircle className="h-5 w-5 mr-2" />
            Nowa ścieżka edukacyjna
          </Button>
        </Link>
      </div>

      {/* Educational Paths Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Lista ścieżek edukacyjnych</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search Section */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Wyszukaj ścieżkę edukacyjną..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors w-full"
                />
              </div>
              <div className="text-sm text-gray-500">
                Znaleziono {filteredPaths.length} z {paths.length} ścieżek
              </div>
            </div>

            {/* Content Section */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-orange-600 h-8 w-8" />
              </div>
            ) : filteredPaths.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <GraduationCap className="h-12 w-12 text-gray-300" />
                  <div>
                    <p className="text-gray-500 font-medium">
                      {searchTerm ? "Brak wyników wyszukiwania" : "Brak ścieżek edukacyjnych"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm 
                        ? "Spróbuj użyć innych słów kluczowych" 
                        : "Utwórz swoją pierwszą ścieżkę edukacyjną, aby zorganizować kursy"
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tytuł</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Opis</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPaths.map(path => (
                        <tr key={path.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <Link 
                              href={`/teacher/educational-paths/${path.id}`} 
                              className="text-orange-600 hover:text-orange-800 font-medium hover:underline transition-colors"
                            >
                              {path.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="max-w-md truncate">{path.description}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === path.id}
                              onClick={() => handleDelete(path.id)}
                              className="hover:bg-red-600"
                            >
                              {deletingId === path.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              Usuń
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationalPathsPage;
