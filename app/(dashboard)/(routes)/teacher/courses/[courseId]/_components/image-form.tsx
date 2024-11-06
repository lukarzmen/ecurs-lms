"use client";

import axios from "axios";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { ImageIcon, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/file-upload";

interface ImageFormProps {
  imageUrl: string;
  courseId: string;
}
export const ImageForm = ({ imageUrl, courseId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };
  const onSubmit = async () => {
    // try {
    //     await axios.patch(`/api/courses/${courseId}`, values);
    //     toast.success("Course updated");
    //     toogleEdit();
    //     router.refresh();
    // } catch (error) {
    //     toast.error("Something went wrong");
    // }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Image
        <Button onClick={toogleEdit} variant="ghost">
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
          <ImageIcon className="h-10 w-10 text-slate-500"></ImageIcon>
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 bg-slate-200 rounded-md overflow-hidden">
          <img
            src={imageUrl}
            alt="Course Image"
            className="object-cover rounded-md h-full w-full"
          />
        </div>
      )}
      {isEditing && (
        <div>
          <FileUpload courseId={courseId}></FileUpload>
          {/* <div className="text-xs text-muted-foreground mt-4">
                            16:9 aspect ratio recommended
                        </div> */}
        </div>
      )}
    </div>
  );
};

export default ImageForm;
