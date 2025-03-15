"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import toast from "react-hot-toast";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/courses", {
        title,
        categoryId: parseInt(category) || undefined,
        description: description || undefined
      });
      router.push(`/teacher/courses/${response.data.id}`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div className="text-2xl">
      <h1>
          {step === 1 && "Name your course"}
          {step === 2 && "Select a category for your course"}
          {step === 3 && "Describe your course"}
          {step === 4 && "Add an image for your course"}
        </h1>
        <form onSubmit={onSubmit} className="space-y-8 mt-8">
          {step === 1 && (
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <p className="text-sm text-slate-600">
                What would you like to call your course? Don't worry, you can change this later.
              </p>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. 'Advanced web development'"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="text-sm text-slate-600">What will you teach in this course?</p>
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={!title || isSubmitting}
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <p className="text-sm text-slate-600">
                Which category best fits your course? You can choose from the list of available categories. Don't stress too much about it; you can always modify this later if needed.
              </p>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-4">

              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <p className="text-sm text-slate-600">
                How would you describe your course? Provide a brief overview that captures the essence of what you’ll be teaching. You can refine or expand this description as you go along.
              </p>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. 'This course covers...'"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePage;
