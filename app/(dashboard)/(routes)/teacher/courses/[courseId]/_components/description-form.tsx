"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
      toast.success("Course updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border bg-indigo-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        About
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2"></Pencil>
              Edit
            </>
          )}
        </Button>
      </div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <textarea
              value={descriptionValue}
              onChange={handleChange}
              disabled={isSubmitting}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-x-2">
            <button
              type="submit"
              disabled={!descriptionValue || isSubmitting}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className={!descriptionValue ? "text-sm mt-2" : ""}>
          {descriptionValue || "No description"}
        </div>
      )}
    </div>
  );
};

export default DescriptionForm;
