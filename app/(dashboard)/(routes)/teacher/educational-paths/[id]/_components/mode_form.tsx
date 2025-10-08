"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";


export default function EduPathModeForm({ educationalPathId: id, mode }: { educationalPathId: string, mode: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [formMode, setFormMode] = useState(mode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleEdit = () => {
    setIsEditing((v) => !v);
    setFormMode(currentMode); // Reset form value on cancel
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormMode(parseInt(e.target.value, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/educational-paths/${id}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: formMode }),
      });
      if (!res.ok) throw new Error();
      setCurrentMode(formMode);
      toast.success("Zaktualizowano tryb kursu");
      setIsEditing(false);
    } catch {
      toast.error("Coś poszło nie tak");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="mt-6 border bg-orange-100 rounded-md p-4 h-full flex flex-col">
      <div className="font-medium flex items-center justify-between">
        Tryb ścieżki edukacyjnej
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
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">Tryb ścieżki edukacyjnej</label>
            <select
              value={formMode}
              onChange={handleSelectChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            >
              <option value={0}>Prywatny (tylko zaproszeni)</option>
              <option value={1}>Publiczny (widoczny w marketplace)</option>
            </select>
          </div>
          <div className="flex items-center gap-x-2">
            <button type="submit" className="bg-orange-600 text-white font-semibold py-2 px-4 rounded-md" disabled={isSubmitting}>
              Zapisz
            </button>
          </div>
        </form>
      ) : (
        <>
            <div className="text-sm mb-2">
              <span className="font-semibold text-orange-700">
                {currentMode === 0 ? "Prywatny" : "Publiczny"}
              </span>
            {" – "}
            {currentMode === 0
              ? "ścieżka widoczna tylko dla zaproszonych użytkowników."
              : "ścieżka widoczna w marketplace."}
            </div>
        </>
      )}
    </div>
  );
}