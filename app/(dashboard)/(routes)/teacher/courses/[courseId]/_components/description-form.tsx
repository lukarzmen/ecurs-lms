"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import { Pencil, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface DescriptionFormProps {
  description: string;
  courseId: string;
}

const DescriptionForm: React.FC<DescriptionFormProps> = ({ description, courseId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/courses/${courseId}`, { description: descriptionValue });
      toast.success("Zaktualizowano kurs");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title="O kursie"
        icon={FileText}
        status={{
          label: isEditing ? "Edycja" : (descriptionValue ? "Zapisano" : "Brak opisu"),
          variant: isEditing ? "secondary" : (descriptionValue ? "default" : "outline"),
          className: isEditing ? "bg-blue-500 text-white" : (descriptionValue ? "bg-green-500" : "")
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Opis kursu</span>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                value={descriptionValue}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Opisz swój kurs..."
                rows={4}
              />
            </div>
            <FormActions>
              <Button
                type="submit"
                disabled={!descriptionValue || isSubmitting}
                className="flex-1"
              >
                Zapisz
              </Button>
            </FormActions>
          </form>
        ) : (
          <div>
            {descriptionValue ? (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm">{descriptionValue}</p>
              </div>
            ) : (
              <FormSection variant="warning">
                <p>
                  <strong>Brak opisu kursu</strong><br />
                  Dodaj opis aby potencjalni uczestnicy wiedzieli czego się spodziewać
                </p>
              </FormSection>
            )}
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default DescriptionForm;
