"use client";
import { useEffect, useState } from "react";

export default function ChapterStateBar({ chapterId, state }: { chapterId: string; state: number }) {
  const [chapterState, setChapterState] = useState(state);
  const [loading, setLoading] = useState(false);

  const changeState = async (newState: number) => {
    setLoading(true);
    await fetch(`/api/module/${chapterId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    });
    setChapterState(newState);
    setLoading(false);
  };

  useEffect(() => {
    setChapterState(state);
  }, [state]);

  return (
    <div className="mb-6">
      {chapterState === 0 && (
        <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-yellow-800 font-medium">
            Rozdział jest w przygotowaniu (szkic)
          </span>
          <div className="ml-auto flex gap-2">
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => changeState(1)}
              disabled={loading}
            >
              {loading ? "Zapisywanie..." : "Opublikuj"}
            </button>
          </div>
        </div>
      )}
      {chapterState === 1 && (
        <div className="w-full p-3 bg-green-100 border border-green-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-green-800 font-medium">
            Rozdział jest opublikowany.
          </span>
          <div className="ml-auto flex gap-2">
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
    </div>
  );
}