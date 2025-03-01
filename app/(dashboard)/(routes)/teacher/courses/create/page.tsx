"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/courses", { title });
      router.push(`/teacher/courses/${response.data.id}`);
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div className="text-2xl">
        <h1>Name your course</h1>
        <p className="text-sm text-slate-600">
          What would you like to call your course? Don't worry, you can
          change this later.
        </p>
        <form onSubmit={onSubmit} className="space-y-8 mt-8">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Course title
            </label>
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
          </div>
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={!title || isSubmitting}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePage;
