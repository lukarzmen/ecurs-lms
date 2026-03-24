"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import next from "next";
import { ArrowLeft, Loader2, BookOpen, FolderOpen, FileText, DollarSign, CheckCircle2, Sparkles } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (isGenerating || isSubmitting) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt:
            "Jesteś doświadczonym copywriterem sprzedażowym. Napisz zwięzły, sprzedażowy opis kursu po polsku (2-3 krótkie zdania). Nie używaj emoji. Skup się na konkretnej korzyści dla kupującego i wyniku, który osiągnie. Pisz językiem korzyści, nie funkcji. Bądź konkretny, nie lej wody.",
          userPrompt:
            `Napisz krótki, sprzedażowy opis kursu ${title ? `"${title}"` : "(tytuł nieznany)"}. Maksymalnie 2-3 zdania. ${title ? "" : "Jeśli nie znasz tematu, napisz neutralny opis ogólny bez zmyślania faktów."}`,
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const text = (await response.text()).trim();
      if (!text) {
        toast.error("AI nie zwróciło treści");
        return;
      }

      setDescription(text);
      toast.success("Opis został wygenerowany przez AI");
    } catch {
      toast.error("Błąd podczas generowania opisu");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let pricePayload: any = undefined;
      if (!isNaN(Number(price))) {
        // Konwersja ceny brutto na netto
        const priceNetto = Number(price) / (1 + Number(vatRate) / 100);
        pricePayload = {
          amount: priceNetto,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl w-full mx-auto flex flex-col p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teacher/courses"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition mb-4 select-none gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do listy kursów
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    s <= step
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-0.5 w-12 sm:w-16 mx-2 transition-all ${
                      s < step ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-muted-foreground text-center">
            Krok {step} z 4
          </p>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {step === 1 && "🎓 Nazwij swój kurs"}
            {step === 2 && "📁 Wybierz kategorię"}
            {step === 3 && "📝 Opisz swój kurs"}
            {step === 4 && "💰 Ustal cenę"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 && "Stwórz przyciągający tytuł dla swojego kursu"}
            {step === 2 && "Wybierz kategorię, która najlepiej pasuje"}
            {step === 3 && "Dodaj szczegółowy opis kursu"}
            {step === 4 && "Zdecyduj o modelu cenowym"}
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-8">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <BookOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Tytuł powinien być jasny, konkretny i przyciągający. To pierwsza rzecz, którą zobaczą potencjalni uczniowie.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-2">
                      Tytuł kursu
                    </label>
                    <Input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="np. 'Zaawansowane programowanie aplikacji web'"
                      className="border-2 text-base py-2.5"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {title.length}/50 znaków
                    </p>
                  </div>
                  <div className="flex items-center gap-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/teacher/courses")}
                      disabled={isSubmitting}
                    >
                      Anuluj
                    </Button>
                    <Button
                      type="button"
                      disabled={!title || isSubmitting}
                      onClick={nextStep}
                    >
                      Dalej
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <FolderOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Kategoria pomaga użytkownikom znaleźć Twój kurs. Wybierz najlepiej pasującą do treści.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
                      Kategoria
                    </label>
                    <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                      <SelectTrigger className="border-2">
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
                  </div>
                  <div className="flex items-center gap-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isSubmitting}
                    >
                      Wstecz
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={nextStep}
                    >
                      Dalej
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Opis powinien być zachęcający i pokazywać wartość, którą otrzymają uczniowie.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
                      Opis kursu
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting || isGenerating}
                      placeholder="np. 'Ten kurs obejmuje zaawansowane koncepty programowania web...'"
                      className="border-2 resize-none min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {description.length}/500 znaków
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isSubmitting || isGenerating}
                    variant="outline"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generuję...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generuj AI
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isSubmitting}
                    >
                      Wstecz
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={nextStep}
                    >
                      Dalej
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <DollarSign className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Ustaw cenę, która odzwierciedla wartość Twojego kursu. Możesz ją zmienić w dowolnym momencie.
                    </p>
                  </div>

                  {/* Price */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Cena kursu (brutto)
                    </label>
                    <p className="text-xs text-muted-foreground">Podaj cenę, którą zobaczą kupujący (z VAT)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        id="price"
                        min={0}
                        step={0.01}
                        value={price.toString()}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        disabled={isSubmitting}
                        placeholder="0.00"
                        className="border-2"
                      />
                      <Input
                        type="text"
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        disabled={isSubmitting}
                        placeholder="PLN"
                        className="border-2 uppercase"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  {/* VAT */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Stawka VAT
                    </label>
                    <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))} disabled={isSubmitting}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="23">23% (standardowa)</SelectItem>
                        <SelectItem value="0">0% (zwolniona)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subscription */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={e => {
                          setIsRecurring(e.target.checked);
                          if (!e.target.checked) setInterval("ONE_TIME");
                        }}
                        disabled={isSubmitting}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground">Opłata cykliczna (subskrypcja)</span>
                    </label>
                    {isRecurring && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-border">
                        <div>
                          <label htmlFor="interval" className="text-sm font-medium text-foreground block mb-2">Okres rozliczenia</label>
                          <Select value={interval} onValueChange={(value) => setInterval(value as any)} disabled={isSubmitting}>
                            <SelectTrigger className="border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTH">Miesięcznie</SelectItem>
                              <SelectItem value="YEAR">Rocznie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground block">Okres próbny</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="trialPeriodType" value="DAYS" checked={trialPeriodType === "DAYS"} onChange={() => setTrialPeriodType("DAYS")} disabled={isSubmitting} className="cursor-pointer" />
                              <span className="text-sm">Liczba dni</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="trialPeriodType" value="DATE" checked={trialPeriodType === "DATE"} onChange={() => setTrialPeriodType("DATE")} disabled={isSubmitting} className="cursor-pointer" />
                              <span className="text-sm">Data zakończenia</span>
                            </label>
                          </div>
                        </div>

                        {trialPeriodType === "DAYS" && (
                          <div>
                            <label htmlFor="trialPeriodDays" className="text-sm font-medium text-foreground block mb-2">Ilość dni próbnych</label>
                            <Input
                              type="number"
                              id="trialPeriodDays"
                              min={0}
                              step={1}
                              value={trialPeriodDays.toString()}
                              onChange={e => setTrialPeriodDays(Number(e.target.value))}
                              disabled={isSubmitting}
                              placeholder="np. 7"
                              className="border-2"
                            />
                          </div>
                        )}
                        {trialPeriodType === "DATE" && (
                          <div>
                            <label htmlFor="trialPeriodEnd" className="text-sm font-medium text-foreground block mb-2">Data zakończenia okresu próbnego</label>
                            <Input
                              type="date"
                              id="trialPeriodEnd"
                              value={trialPeriodEnd}
                              onChange={e => setTrialPeriodEnd(e.target.value)}
                              disabled={isSubmitting}
                              min={new Date().toISOString().split('T')[0]}
                              className="border-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm font-medium text-foreground mb-2">Podsumowanie:</p>
                    {price === 0 ? (
                      <p className="text-lg font-bold text-primary">Darmowy 🎁</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm"><span className="font-semibold text-foreground">{price} {currency}</span> brutto (z VAT {vatRate}%)</p>
                        <p className="text-sm text-muted-foreground">({(price / (1 + vatRate / 100)).toFixed(2)} {currency} netto)</p>
                        {isRecurring && price > 0 && (
                          <p className="text-sm text-primary font-medium mt-1">
                            {interval === 'YEAR' ? '📅 Płatność co rok' : '📅 Płatność co miesiąc'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isSubmitting}
                    >
                      Wstecz
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !title}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      ) : null}
                      {isSubmitting ? 'Tworzenie...' : 'Utwórz kurs'}
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
