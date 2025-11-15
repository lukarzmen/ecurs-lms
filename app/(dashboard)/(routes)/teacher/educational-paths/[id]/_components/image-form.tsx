"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil, PlusCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import toast from "react-hot-toast";
import Image from "next/image";


interface ImageFormProps {
  imageId: string;
  educationalPathId: string;
  onImageChange?: (imageId: string) => void;
}

const ImageForm: React.FC<ImageFormProps> = ({ imageId, educationalPathId, onImageChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();
  const imageUrl = `/api/image/${imageId}`;
  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image) return;
    try {
      const uploadImageForm = new FormData();
      uploadImageForm.append("file", image);

      const response = await fetch("/api/image", {
        method: "POST",
        body: uploadImageForm,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }
      const { id } = await response.json();

      const values = { imageId: id };
      const patchRes = await axios.patch(`/api/educational-paths/${educationalPathId}`, values);
      if (onImageChange) {
        onImageChange(id);
      }
      toast.success("Zaktualizowano ścieżkę edukacyjną");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title="Miniatura"
        icon={ImageIcon}
        status={{
          label: imageId ? "Obraz dodany" : "Brak obrazu",
          variant: imageId ? "default" : "outline",
          className: imageId ? "bg-green-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Obraz wyświetlany jako miniatura ścieżki edukacyjnej</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              "Anuluj"
            ) : imageId ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj
              </>
            )}
          </Button>
        </div>
        {!isEditing ? (
          !imageId ? (
            <FormSection variant="warning">
              <p>
                <strong>Brak miniatury</strong><br />
                Dodaj obraz, aby zwiększyć atrakcyjność ścieżki edukacyjnej
              </p>
            </FormSection>
          ) : (
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-md overflow-hidden border">
              <Image
                src={imageUrl}
                alt="Educational Path Image"
                width={400}
                height={160}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain rounded-md h-full w-full"
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
              />
            </div>
          )
        ) : (
          <div className="space-y-4">
            {image && (
              <div className="flex items-center justify-center p-4 bg-muted rounded-md border">
                <span className="text-sm text-muted-foreground">{image.name}</span>
              </div>
            )}
            {isEditing && (
              <form onSubmit={handleSubmit} className="mt-4 flex items-center justify-between">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-full file:border-0
                 file:text-sm file:font-semibold
                 file:bg-slate-50 file:text-slate-700
                 hover:file:bg-slate-100"
                />
                <Button
                  type="submit"
                  disabled={!image}
                  className="ml-4"
                >
                  Prześlij
                </Button>
              </form>
            )}
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default ImageForm;
