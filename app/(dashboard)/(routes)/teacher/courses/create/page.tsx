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
import { useI18n } from "@/hooks/use-i18n";

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
  const { t } = useI18n();

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
        toast.error(t("create.step3.aiEmpty"));
        return;
      }

      setDescription(text);
      toast.success(t("create.step3.aiSuccess"));
    } catch {
      toast.error(t("create.step3.aiError"));
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
      toast.error(t("common.error"));
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
            {t("create.backToCourses")}
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
            {t("create.stepOf").replace("{step}", String(step)).replace("{total}", "4")}
          </p>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            {step === 1 && t("create.step1.title")}
            {step === 2 && t("create.step2.title")}
            {step === 3 && t("create.step3.title")}
            {step === 4 && t("create.step4.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 1 && t("create.step1.subtitle")}
            {step === 2 && t("create.step2.subtitle")}
            {step === 3 && t("create.step3.subtitle")}
            {step === 4 && t("create.step4.subtitle")}
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
                      {t("create.step1.hint")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-2">
                      {t("create.step1.label")}
                    </label>
                    <Input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t("create.step1.placeholder")}
                      className="border-2 text-base py-2.5"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("create.step1.charCount").replace("{count}", String(title.length))}
                    </p>
                  </div>
                  <div className="flex items-center gap-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/teacher/courses")}
                      disabled={isSubmitting}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="button"
                      disabled={!title || isSubmitting}
                      onClick={nextStep}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <FolderOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {t("create.step2.hint")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
                      {t("create.step2.label")}
                    </label>
                    <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder={t("create.step2.placeholder")} />
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
                      {t("common.back")}
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={nextStep}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {t("create.step3.hint")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
                      {t("create.step3.label")}
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting || isGenerating}
                      placeholder={t("create.step3.placeholder")}
                      className="border-2 resize-none min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("create.step3.charCount").replace("{count}", String(description.length))}
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
                        {t("create.step3.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("create.step3.generateAi")}
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
                      {t("common.back")}
                    </Button>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={nextStep}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <DollarSign className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      {t("create.step4.hint")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      {t("create.step4.priceLabel")}
                    </label>
                    <p className="text-xs text-muted-foreground">{t("create.step4.priceHint")}</p>
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
                      {t("create.step4.vatLabel")}
                    </label>
                    <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))} disabled={isSubmitting}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="23">{t("create.step4.vatStandard")}</SelectItem>
                        <SelectItem value="0">{t("create.step4.vatExempt")}</SelectItem>
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
                      <span className="text-sm font-medium text-foreground">{t("create.step4.recurring")}</span>
                    </label>
                    {isRecurring && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-border">
                        <div>
                          <label htmlFor="interval" className="text-sm font-medium text-foreground block mb-2">{t("create.step4.billingPeriod")}</label>
                          <Select value={interval} onValueChange={(value) => setInterval(value as any)} disabled={isSubmitting}>
                            <SelectTrigger className="border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTH">{t("create.step4.monthly")}</SelectItem>
                              <SelectItem value="YEAR">{t("create.step4.yearly")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground block">{t("create.step4.trialPeriod")}</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="trialPeriodType" value="DAYS" checked={trialPeriodType === "DAYS"} onChange={() => setTrialPeriodType("DAYS")} disabled={isSubmitting} className="cursor-pointer" />
                              <span className="text-sm">{t("create.step4.trialDays")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="trialPeriodType" value="DATE" checked={trialPeriodType === "DATE"} onChange={() => setTrialPeriodType("DATE")} disabled={isSubmitting} className="cursor-pointer" />
                              <span className="text-sm">{t("create.step4.trialDate")}</span>
                            </label>
                          </div>
                        </div>

                        {trialPeriodType === "DAYS" && (
                          <div>
                            <label htmlFor="trialPeriodDays" className="text-sm font-medium text-foreground block mb-2">{t("create.step4.trialDaysLabel")}</label>
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
                            <label htmlFor="trialPeriodEnd" className="text-sm font-medium text-foreground block mb-2">{t("create.step4.trialEndLabel")}</label>
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
                    <p className="text-sm font-medium text-foreground mb-2">{t("create.step4.summary")}</p>
                    {price === 0 ? (
                      <p className="text-lg font-bold text-primary">{t("common.free")}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm"><span className="font-semibold text-foreground">{price} {currency}</span> {t("create.step4.gross").replace("{vatRate}", String(vatRate))}</p>
                        <p className="text-sm text-muted-foreground">({(price / (1 + vatRate / 100)).toFixed(2)} {currency} {t("create.step4.net")})</p>
                        {isRecurring && price > 0 && (
                          <p className="text-sm text-primary font-medium mt-1">
                            {interval === 'YEAR' ? t("create.step4.paymentYearly") : t("create.step4.paymentMonthly")}
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
                      {t("common.back")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !title}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      ) : null}
                      {isSubmitting ? t("common.creating") : t("create.step4.createCourse")}
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
