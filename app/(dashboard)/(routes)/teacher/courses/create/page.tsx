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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [vatRate, setVatRate] = useState<number>(23);

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
          vatRate: Number(vatRate),
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
        <Card className="mt-8">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-8">
              {step === 1 && (
                <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tytuł
              </label>
              <p className="text-sm text-slate-600">
                Jak chciałbyś nazwać swój kurs? Nie martw się, możesz to później zmienić.
              </p>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="np. 'Zaawansowane programowanie aplikacji web'"
              />
              <p className="text-sm text-slate-600">Czego będziesz uczyć w tym kursie?</p>
              <div className="flex items-center gap-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 sm:w-48"
                  onClick={() => router.push("/teacher/courses")}
                  disabled={isSubmitting}
                >
                  Anuluj
                </Button>
                <Button
                  type="button"
                  className="w-40 sm:w-48"
                  disabled={!title || isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
                </Button>
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
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 sm:w-48"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </Button>
                <Button
                  type="button"
                  className="w-40 sm:w-48"
                  disabled={isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
                </Button>
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
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="np. 'Ten kurs obejmuje...'"
              />
              <div className="flex items-center gap-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 sm:w-48"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </Button>
                <Button
                  type="button"
                  className="w-40 sm:w-48"
                  disabled={isSubmitting}
                  onClick={nextStep}
                >
                  Dalej
                </Button>
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
                <span className="font-semibold text-slate-700">Darmowy</span>.
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  id="price"
                  min={0}
                  step={0.01}
                  value={price.toString()}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={isSubmitting}
                  placeholder="np. 0 lub 199"
                />
                <Input
                  type="text"
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  placeholder="Waluta (np. PLN)"
                />
              </div>

              <div className="flex flex-col mt-3">
                <label htmlFor="vatRate" className="text-sm font-medium text-gray-700">
                  Stawka VAT
                </label>
                <p className="text-xs text-slate-600 mb-1">
                  Wybierz odpowiednią stawkę VAT dla usługi edukacyjnej
                </p>
                <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="23">23% (standardowa)</SelectItem>
                    <SelectItem value="0">0% (zwolniona)</SelectItem>
                  </SelectContent>
                </Select>
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
                      <Select value={interval} onValueChange={(value) => setInterval(value as any)} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTH">Miesięcznie</SelectItem>
                          <SelectItem value="YEAR">Rocznie</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input
                          type="number"
                          id="trialPeriodDays"
                          min={0}
                          step={1}
                          value={trialPeriodDays.toString()}
                          onChange={e => setTrialPeriodDays(Number(e.target.value))}
                          disabled={isSubmitting}
                          placeholder="np. 7"
                        />
                      </div>
                    )}
                    {trialPeriodType === "DATE" && (
                      <div className="flex flex-col mt-1">
                        <label htmlFor="trialPeriodEnd" className="text-xs">Data zakończenia okresu próbnego</label>
                        <Input
                          type="date"
                          id="trialPeriodEnd"
                          value={trialPeriodEnd}
                          onChange={e => setTrialPeriodEnd(e.target.value)}
                          disabled={isSubmitting}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="text-sm mt-2">
                {price === 0 ? (
                  <span className="font-semibold text-slate-700">Darmowy</span>
                ) : (
                  <>
                    <span className="font-semibold text-slate-700">{price} {currency} netto</span>
                    <span className="text-slate-600 ml-2">({(price * (1 + vatRate / 100)).toFixed(2)} {currency} brutto, VAT {vatRate}%)</span>
                  </>
                )}
                {isRecurring && price > 0 && (
                  <div className="text-sm text-muted-foreground">{interval === 'YEAR' ? 'płatność co rok' : 'płatność co miesiąc'}</div>
                )}
              </div>
              <div className="flex items-center gap-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 sm:w-48"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Wstecz
                </Button>
                <Button
                  type="submit"
                  className="w-40 sm:w-48"
                  disabled={isSubmitting || !title}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : null}
                  Utwórz
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  </div>
</div>
  );
};

export default CreatePage;
