"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function EducationalPathStateBar({ educationalPathId, mode, state }: { educationalPathId: string, mode: number, state: number }) {

  const [pathState, setPathState] = useState(state);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeState = async (newState: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/educational-paths/${educationalPathId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Nie można opublikować ścieżki. Brak aktywnych kursów.");
      } else {
        setPathState(newState);
      }
    } catch (e) {
      setError("Wystąpił błąd sieci. Spróbuj ponownie.");
    }
    setLoading(false);
  };

  useEffect(() => {
    setPathState(state);
  }, [state]);

  return (
    <div className="mb-6">
      {error && (
        <div className="w-full p-2 mb-2 bg-red-100 border border-red-300 rounded text-red-800 font-medium">
          {error}
        </div>
      )}
      {pathState === 0 && (
        <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-yellow-800 font-medium">Ścieżka edukacyjna jest w przygotowaniu (szkic)</span>
          <div className="ml-auto flex gap-2">
            <Button
              onClick={() => changeState(1)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Opublikuj"}
            </Button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(2)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Opublikuj (w budowie)"}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Archiwizuj"}
            </button>
          </div>
        </div>
      )}
      {pathState === 1 && (
        <div className="w-full p-3 bg-green-100 border border-green-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-green-800 font-medium">Ścieżka edukacyjna jest opublikowana (tworzenie treści zamknięte).</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(2)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "W budowie"}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Archiwizuj"}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Wróć do szkicu"}
            </button>
          </div>
        </div>
      )}
      {pathState === 2 && (
        <div className="w-full p-3 bg-blue-100 border border-blue-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-blue-800 font-medium">Ścieżka edukacyjna jest opublikowana (treść w trakcie budowy).</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(1)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Zamknij treść"}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(3)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Archiwizuj"}
            </button>
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Wróć do szkicu"}
            </button>
          </div>
        </div>
      )}
      {pathState === 3 && (
        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-gray-800 font-medium">Ścieżka edukacyjna jest zarchiwizowana.</span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(0)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Przywróć do szkicu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}