"use client";
import { useEffect, useState } from "react";

export default function CourseStateBar({ courseId, mode, state }: { courseId: string, mode: number, state: number }) {
  const [courseState, setCourseState] = useState(state);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    await fetch(`/api/courses/${courseId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: 1 }), // 1 = PUBLISHED
    });
    setCourseState(1);
    setPublishing(false);
  };

  useEffect(() => {
    setCourseState(state);
  }, [state]);

  return (
    <div className="mb-6">
      {courseState === 0 && (
        <div className="w-full p-3 bg-yellow-100 border border-yellow-300 rounded flex flex-col sm:flex-row items-center gap-2">
          <span className="text-yellow-800 font-medium">
            Kurs jest w przygotowaniu
          </span>
          <button
            className="ml-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? "Publikowanie..." : "Opublikuj kurs"}
          </button>
        </div>
      )}
      {courseState === 1 && (
        <div className="w-full p-3 bg-green-100 border border-green-300 rounded text-green-800 font-medium">
          Kurs jest opublikowany.
        </div>
      )}
    </div>
  );
}