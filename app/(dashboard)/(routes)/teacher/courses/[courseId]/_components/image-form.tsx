"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil, PlusCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageFormProps {
  imageUrl: string;
  courseId: string;
}

const ImageForm: React.FC<ImageFormProps> = ({ imageUrl, courseId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();

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
      const formData = new FormData();
      formData.append("image", image);
      await axios.patch(`/api/courses/${courseId}`, formData);
      alert("Course updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-indigo-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Image
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && imageUrl && (
            <>
              <Pencil className="h-4 w-4 mr-2"></Pencil>
              Edit
            </>
          )}
          {!isEditing && !imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
              Add
            </>
          )}
        </Button>
      </div>
      {!isEditing && !imageUrl ? (
        <div className="flex items-center justify-center h-40 bg-slate-200 rounded-md">
          <ImageIcon className="h-10 w-10 text-slate-500" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 bg-indigo-100 rounded-md overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Course Image"
              className="object-cover rounded-md h-full w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-indigo-600">
              No Image Available
            </div>
          )}
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
           file:bg-indigo-50 file:text-indigo-600
           hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-4"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
};

export default ImageForm;
