"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

const EducationalPathsPage = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    fetchPaths();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tę ścieżkę edukacyjną?")) return;
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 mt-6 flex items-center gap-2">
        <span>🎓 Twoje ścieżki edukacyjne</span>
        <span className="text-base font-normal text-gray-400 ml-2">
          ({paths.length})
        </span>
      </h1>
      <div className="flex flex-col space-y-4 py-4 md:flex-row md:space-y-0 md:space-x-4 md:justify-between select-none">
        <div></div>
        <div className="flex gap-2 md:ml-auto">
          <Link href="/teacher/educational-paths/create">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nowa ścieżka edukacyjna
            </Button>
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center mt-8">
          <Loader2 className="animate-spin text-orange-700" size={32} />
        </div>
      ) : paths.length === 0 ? (
        <div className="text-gray-500">Brak ścieżek edukacyjnych.</div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Tytuł</th>
                <th className="p-2 text-left">Opis</th>
                <th className="p-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {paths.map(path => (
                <tr key={path.id} className="border-t">
                  <td className="p-2">
                    <Link href={`/teacher/educational-paths/${path.id}`} className="text-orange-600 hover:underline">
                      {path.title}
                    </Link>
                  </td>
                  <td className="p-2">{path.description}</td>
                  <td className="p-2 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === path.id}
                      onClick={() => handleDelete(path.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Usuń
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EducationalPathsPage;
