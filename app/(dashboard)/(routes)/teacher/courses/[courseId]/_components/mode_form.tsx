"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard, FormActions } from "@/components/ui/form-card";
import { Pencil, Settings } from "lucide-react";
import toast from "react-hot-toast";


export default function CourseModeForm({ courseId, mode }: { courseId: string, mode: number }) {
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
      const res = await fetch(`/api/courses/${courseId}/mode`, {
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
    <div className="mt-6">
      <FormCard
        title="Tryb kursu"
        icon={Settings}
        status={{
          label: isEditing ? "Edycja" : (currentMode === 0 ? "Prywatny" : "Publiczny"),
          variant: isEditing ? "secondary" : "default",
          className: isEditing ? "bg-blue-500 text-white" : "bg-green-500"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Widoczność kursu</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Select value={formMode.toString()} onValueChange={(value) => setFormMode(parseInt(value, 10))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz tryb kursu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Prywatny (tylko zaproszeni)</SelectItem>
                  <SelectItem value="1">Publiczny (widoczny w marketplace)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormActions>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                Zapisz
              </Button>
            </FormActions>
          </form>
        ) : (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">
              {currentMode === 0 ? "Prywatny" : "Publiczny"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMode === 0
                ? "Kurs widoczny tylko dla zaproszonych użytkowników"
                : "Kurs widoczny w marketplace"}
            </p>
          </div>
        )}
      </FormCard>
    </div>
  );
}