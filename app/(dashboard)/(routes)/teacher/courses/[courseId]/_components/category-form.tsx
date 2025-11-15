"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import toast from "react-hot-toast";

const CategoryForm = ({ categoryId, courseId, options }: { categoryId: number; courseId: number; options: { label: string; value: number; }[] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [categoryIdState, setCategoryIdState] = useState(categoryId);
  const router = useRouter();

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/courses/${courseId}`, { categoryId: categoryIdState });
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
        title="Kategoria kursu"
        icon={Tag}
        status={{
          label: isEditing ? "Edycja" : (selectedOption ? "Ustawiono" : "Brak kategorii"),
          variant: isEditing ? "secondary" : (selectedOption ? "default" : "outline"),
          className: isEditing ? "bg-blue-500 text-white" : (selectedOption ? "bg-green-500" : "")
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Kategoria tematyczna kursu</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              <>Anuluj</>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2"></Pencil>
                Edytuj
              </>
            )}
          </Button>
        </div>
        {isEditing ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Select 
                value={categoryIdState.toString()} 
                onValueChange={(value) => setCategoryIdState(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormActions>
              <Button type="submit" className="flex-1">
                Zapisz
              </Button>
            </FormActions>
          </form>
        ) : (
          <div>
            {selectedOption ? (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium">{selectedOption}</p>
              </div>
            ) : (
              <FormSection variant="warning">
                <p>
                  <strong>Brak wybranej kategorii</strong><br />
                  Wybierz kategorię aby ułatwić znajdowanie kursu
                </p>
              </FormSection>
            )}
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default CategoryForm;
