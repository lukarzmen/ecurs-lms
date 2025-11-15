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
  courseId: string;
}

const ImageForm: React.FC<ImageFormProps> = ({ imageId: imageId, courseId }) => {
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
      await axios.patch(`/api/courses/${courseId}`, values);

      toast.success("Zaktualizowano kurs");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title="Miniatura kursu"
        icon={ImageIcon}
        status={{
          label: isEditing ? "Edycja" : (imageId ? "Ustawiono" : "Brak miniatury"),
          variant: isEditing ? "secondary" : (imageId ? "default" : "outline"),
          className: isEditing ? "bg-blue-500 text-white" : (imageId ? "bg-green-500" : "")
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Obraz przedstawiający kurs</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing && <>Anuluj</>}
            {!isEditing && imageId && (
              <>
                <Pencil className="h-4 w-4 mr-2"></Pencil>
                Edytuj
              </>
            )}
            {!isEditing && !imageId && (
              <>
                <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
                Dodaj
              </>
            )}
          </Button>
        </div>
        
        {!isEditing && !imageId ? (
          <FormSection variant="warning">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Brak miniatury</p>
                <p className="text-xs text-muted-foreground">Dodaj atrakcyjną miniaturę kursu</p>
              </div>
            </div>
          </FormSection>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center h-40 bg-muted/30 rounded-md overflow-hidden border">
              {imageId ? (
                <Image
                  src={imageUrl}
                  alt="Course Image"
                  width={400}
                  height={160}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain rounded-md h-full w-full"
                  style={{ objectFit: "contain", width: "100%", height: "100%" }}
                />
              ) : image ? (
                <div className="flex items-center justify-center h-full w-full text-center">
                  <div>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">{image.name}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full w-full text-center">
                  <div>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nie wybrano obrazka</p>
                  </div>
                </div>
              )}
            </div>
            
            {isEditing && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-primary file:text-primary-foreground
                     hover:file:bg-primary/90 cursor-pointer"
                  />
                </div>
                <FormActions>
                  <Button
                    type="submit"
                    disabled={!image}
                    className="flex-1"
                  >
                    Prześlij
                  </Button>
                </FormActions>
              </form>
            )}
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default ImageForm;
