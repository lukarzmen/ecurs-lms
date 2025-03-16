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
      toast.error("Coś poszło nie tak");
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
        console.error("Nie udało się pobrać kategorii", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div className="text-2xl">
        <h1>
          {step === 1 && "Nazwij swój kurs"}
          {step === 2 && "Wybierz kategorię dla swojego kursu"}
          {step === 3 && "Opisz swój kurs"}
          {step === 4 && "Dodaj obraz do swojego kursu"}
        </h1>
        <form onSubmit={onSubmit} className="space-y-8 mt-8">
          {step === 1 && (
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tytuł
              </label>
              <p className="text-sm text-slate-600">
                Jak chciałbyś nazwać swój kurs? Nie martw się, możesz to później zmienić.
              </p>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="np. 'Zaawansowane programowanie aplikacji web'"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="text-sm text-slate-600">Czego będziesz uczyć w tym kursie?</p>
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => router.push("/teacher/courses")}
                  disabled={isSubmitting}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={!title || isSubmitting}
                  onClick={nextStep}
                >
                  Kontynuuj
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Kategoria
              </label>
              <p className="text-sm text-slate-600">
                Która kategoria najlepiej pasuje do twojego kursu? Możesz wybrać z listy dostępnych kategorii. Nie przejmuj się zbytnio; zawsze możesz to później zmienić.
              </p>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Wybierz kategorię</option>
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
                  Wstecz
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Opis
              </label>
              <p className="text-sm text-slate-600">
                Jak opisałbyś swój kurs? Podaj krótki przegląd, który uchwyci istotę tego, czego będziesz uczyć. Możesz dopracować lub rozszerzyć ten opis w miarę postępów.
              </p>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="np. 'Ten kurs obejmuje...'"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 text-black py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  Zakończ i przejdź dalej
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
