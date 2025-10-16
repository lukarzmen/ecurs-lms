"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import next from "next";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const { userId } = useAuth(); // Assuming you have a way to get the current user's ID
  const [price, setPrice] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [currency, setCurrency] = useState("PLN");
  const [interval, setInterval] = useState<"MONTH" | "YEAR" | "ONE_TIME">("ONE_TIME");
  const [trialPeriodType, setTrialPeriodType] = useState<string>("DAYS");
  const [trialPeriodDays, setTrialPeriodDays] = useState(0);
  const [trialPeriodEnd, setTrialPeriodEnd] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let pricePayload: any = undefined;
      if (!isNaN(Number(price))) {
        pricePayload = {
          amount: Number(price),
          currency,
          isRecurring,
          interval: isRecurring ? interval : "ONE_TIME",
          trialPeriodType: isRecurring ? trialPeriodType : undefined,
        };
        if (isRecurring && trialPeriodType === "DAYS" && trialPeriodDays > 0) {
          pricePayload.trialPeriodDays = trialPeriodDays;
        }
        if (isRecurring && trialPeriodType === "DATE" && trialPeriodEnd && /^\d{4}-\d{2}-\d{2}$/.test(trialPeriodEnd)) {
          pricePayload.trialPeriodEnd = trialPeriodEnd;
        }
      }
      const response = await axios.post("/api/courses", {
        title,
        categoryId: parseInt(category) || undefined,
        description: description || undefined,
        price: pricePayload,
        userProviderId: userId,
        next: { revalidate: 60 }
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
        const response = await fetch("/api/categories", { next: { revalidate: 60 } });
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Nie udało się pobrać kategorii", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col h-full p-6">
      <div className="mb-6">
        <Link
          href="/teacher/courses"
          className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Powrót do listy kursów
        </Link>
      </div>
      <div className="text-2xl w-full mb-6">
        <h1>
          {step === 1 && "Nazwij swój kurs"}
          {step === 2 && "Wybierz kategorię dla swojego kursu"}
          {step === 3 && "Opisz swój kurs"}
          {step === 4 && "Ustal cenę kursu"}
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              <p className="text-sm text-slate-600">Czego będziesz uczyć w tym kursie?</p>
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-gray-200 text-black py-2 px-4 rounded-md font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center transition"
                  onClick={() => router.push("/teacher/courses")}
                  disabled={isSubmitting}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-orange-600 text-white py-2 px-4 rounded-md font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center transition"
                  disabled={!title || isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
                  className="w-40 sm:w-48 bg-gray-200 text-black py-2 px-4 rounded-md font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center transition"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-orange-600 text-white py-2 px-4 rounded-md font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center transition"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-gray-200 text-black py-2 px-4 rounded-md font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center transition"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </button>
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-orange-600 text-white py-2 px-4 rounded-md font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center transition"
                  disabled={isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mb-4">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Cena kursu
              </label>
              <p className="text-sm text-slate-600">
                Ustal cenę kursu. Jeśli wpiszesz 0, kurs będzie{" "}
                <span className="font-semibold text-orange-700">Darmowy</span>.
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  id="price"
                  min={0}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={isSubmitting}
                  placeholder="np. 0 lub 199"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
                <input
                  type="text"
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  placeholder="Waluta (np. PLN)"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2 mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => {
                      setIsRecurring(e.target.checked);
                      if (!e.target.checked) setInterval("ONE_TIME");
                    }}
                    disabled={isSubmitting}
                    className="form-checkbox"
                  />
                  <span className="text-sm">Opłata cykliczna (subskrypcja)</span>
                </label>
                {isRecurring && (
                  <>
                    <div className="flex flex-col mt-1">
                      <label htmlFor="interval" className="text-sm">Okres rozliczenia</label>
                      <select
                        id="interval"
                        value={interval}
                        onChange={e => setInterval(e.target.value as any)}
                        disabled={isSubmitting}
                        className="mt-0 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      >
                        <option value="MONTH">Miesięcznie</option>
                        <option value="YEAR">Rocznie</option>
                      </select>
                    </div>
                    <div className="flex flex-col mt-1">
                      <label className="text-xs">Tryb okresu próbnego</label>
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name="trialPeriodType" value="DAYS" checked={trialPeriodType === "DAYS"} onChange={() => setTrialPeriodType("DAYS")} disabled={isSubmitting} />
                          Dni
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <input type="radio" name="trialPeriodType" value="DATE" checked={trialPeriodType === "DATE"} onChange={() => setTrialPeriodType("DATE")} disabled={isSubmitting} />
                          Data zakończenia
                        </label>
                      </div>
                    </div>
                    {trialPeriodType === "DAYS" && (
                      <div className="flex flex-col mt-1">
                        <label htmlFor="trialPeriodDays" className="text-xs">Okres próbny (dni)</label>
                        <input
                          type="number"
                          id="trialPeriodDays"
                          min={0}
                          step={1}
                          value={trialPeriodDays}
                          onChange={e => setTrialPeriodDays(Number(e.target.value))}
                          disabled={isSubmitting}
                          placeholder="np. 7"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                      </div>
                    )}
                    {trialPeriodType === "DATE" && (
                      <div className="flex flex-col mt-1">
                        <label htmlFor="trialPeriodEnd" className="text-xs">Data zakończenia okresu próbnego</label>
                        <input
                          type="date"
                          id="trialPeriodEnd"
                          value={trialPeriodEnd}
                          onChange={e => setTrialPeriodEnd(e.target.value)}
                          disabled={isSubmitting}
                          min={new Date().toISOString().split('T')[0]}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="text-sm mt-2">
                {price === 0 ? (
                  <span className="font-semibold text-orange-700">Darmowy</span>
                ) : (
                  <span className="font-semibold text-orange-700">{price} {currency}</span>
                )}
                {isRecurring && price > 0 && (
                  <div className="text-sm text-muted-foreground">{interval === 'YEAR' ? 'płatność co rok' : 'płatność co miesiąc'}</div>
                )}
              </div>
              <div className="flex items-center gap-x-2 mt-4">
                <button
                  type="button"
                  className="w-40 sm:w-48 bg-gray-200 text-black py-2 px-4 rounded-md font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center transition"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </button>
                <button
                  type="submit"
                  className="w-40 sm:w-48 bg-orange-600 text-white py-2 px-4 rounded-md font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center transition"
                  disabled={isSubmitting || !title}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : null}
                  Utwórz
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
