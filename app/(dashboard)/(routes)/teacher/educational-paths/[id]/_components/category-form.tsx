"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

interface CategoryFormProps {
  categoryId: number;
  id: number;
  options: { label: string; value: number; }[];
  onCategoryChange?: (catId: number) => void;
}

const CategoryForm = ({ categoryId, id, options, onCategoryChange }: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // If categoryId is undefined or null, use empty string for select
  const [categoryIdState, setCategoryIdState] = useState(
    typeof categoryId === "undefined" || categoryId === null ? "" : categoryId
  );
  // Sync categoryIdState with prop changes
  useEffect(() => {
    setCategoryIdState(
      typeof categoryId === "undefined" || categoryId === null ? "" : categoryId
    );
  }, [categoryId]);
  const router = useRouter();

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (categoryIdState === "") {
      toast.error("Musisz wybrać kategorię przed zapisaniem.");
      return;
    }
    try {
      const res = await axios.patch(`/api/educational-paths/${id}`, { categoryId: categoryIdState });
      if (res.data && typeof res.data.categoryId !== "undefined") {
        setCategoryIdState(res.data.categoryId);
        if (onCategoryChange) {
          onCategoryChange(res.data.categoryId);
        }
      }
      toast.success("Zaktualizowano kategorię");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    }
  };

  const selectedOption = options.find(
    (option) => option.value === categoryId
  )?.label;

  return (
    <div className="mt-6">
      <FormCard
        title="Kategoria"
        icon={Tag}
        status={{
          label: selectedOption ? selectedOption : "Brak kategorii",
          variant: selectedOption ? "default" : "outline",
          className: selectedOption ? "bg-blue-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Przypisz ścieżkę edukacyjną do odpowiedniej kategorii</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              "Anuluj"
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </>
            )}
          </Button>
        </div>
        
        {isEditing ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <Select
              value={categoryIdState === "" ? "" : categoryIdState.toString()}
              onValueChange={(value) => setCategoryIdState(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormActions>
              <Button type="submit" disabled={categoryIdState === ""}>
                Zapisz
              </Button>
            </FormActions>
          </form>
        ) : !selectedOption ? (
          <FormSection variant="warning">
            <p>
              <strong>Brak kategorii</strong><br />
              Przypisz kategorię aby ułatwić znalezienie ścieżki uczniom
            </p>
          </FormSection>
        ) : (
          <div className="p-3 bg-muted/50 rounded-md border">
            <span className="font-medium">{selectedOption}</span>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default CategoryForm;
