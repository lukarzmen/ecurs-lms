"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const CategoryForm = ({ categoryId, courseId, options }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [categoryIdState, setCategoryIdState] = useState(categoryId);
  const router = useRouter();

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/courses/${courseId}`, { categoryId: categoryIdState });
      toast.success("Course updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const selectedOption = options.find(
    (option) => option.value === categoryId
  )?.label;

  return (
    <div className="mt-6 border bg-indigo-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course category
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
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={categoryIdState}
              onChange={(e) => setCategoryIdState(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-x-2">
            <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md">
              Save
            </button>
          </div>
        </form>
      ) : (
        <p className={`text-sm mt-2 ${!categoryId && "text-slate-500 italic"}`}>
          {selectedOption || "No category selected"}
        </p>
      )}
    </div>
  );
};

export default CategoryForm;
