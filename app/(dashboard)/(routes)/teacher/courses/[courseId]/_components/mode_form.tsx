"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default function CourseModeForm({ courseId, mode }: { courseId: string, mode: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);

  const toggleEdit = () => setIsEditing((v) => !v);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = parseInt(e.target.value, 10);
    setCurrentMode(newMode);
    await fetch(`/api/courses/${courseId}/mode`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
    setIsEditing(false);
  };

  return (
    <div className="mt-6 border bg-orange-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Tryb kursu
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Anuluj</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edytuj
            </>
          )}
        </Button>
      </div>
      {isEditing ? (
        <form className="space-y-4 mt-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">Tryb kursu</label>
            <select
              value={currentMode}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            >
              <option value={0}>Prywatny (tylko zaproszeni)</option>
              <option value={1}>Publiczny (widoczny w marketplace)</option>
            </select>
          </div>
        </form>
      ) : (
        <div className="text-sm mt-2">
          <span className={currentMode === 0 ? "font-semibold text-orange-700" : "text-gray-700"}>
            {currentMode === 0 ? "Prywatny" : "Publiczny"}
          </span>
          {" – "}
          {currentMode === 0
            ? "kurs widoczny tylko dla zaproszonych użytkowników."
            : "kurs widoczny w marketplace."}
        </div>
      )}
    </div>
  );
}