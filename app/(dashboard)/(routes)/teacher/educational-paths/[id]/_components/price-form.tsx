"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, DollarSign } from "lucide-react";
import { FormCard } from "@/components/ui/form-card";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

// New price structure: amount, currency, interval, isRecurring
type Price = {
  amount: number;
  currency: string;
  interval?: "ONE_TIME" | "MONTH" | "YEAR";
  isRecurring?: boolean;
  trialPeriodDays?: number;
  trialPeriodEnd?: string;
  trialPeriodType?: string;
  vatRate?: number;
};

function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function round2(value: number) {
  // Round to 2 decimal places properly
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeNetFromGross(gross: number, vatRate?: number) {
  const rate = typeof vatRate === "number" ? vatRate : 0;
  const divisor = 1 + rate / 100;
  if (!isFinite(divisor) || divisor <= 0) return gross;
  return round2(gross / divisor);
}

function computeGrossFromNet(net: number, vatRate?: number) {
  const rate = typeof vatRate === "number" ? vatRate : 0;
  const multiplier = 1 + rate / 100;
  if (!isFinite(multiplier) || multiplier <= 0) return net;
  return round2(net * multiplier);
}

function toNumber(value: unknown, fallback: number) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export default function PriceForm({ price, educationalPathId: id }: { price: Price; educationalPathId: string }) {
  const { t, locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);

  const intervalOptions = [
    { value: "ONE_TIME", label: t("epPrice.oneTime") },
    { value: "MONTH", label: t("epPrice.monthly") },
    { value: "YEAR", label: t("epPrice.yearly") },
  ];
  // Determine initial trial mode
  const initialTrialMode = price?.trialPeriodEnd ? "end" : (price?.trialPeriodDays ? "days" : "days");
  // Convert trialPeriodEnd to yyyy-mm-dd if needed
  function toInputDateFormat(dateStr?: string) {
    if (!dateStr) return "";
    // If already yyyy-mm-dd, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If dd.mm.yyyy, convert
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split(".");
      return `${yyyy}-${mm}-${dd}`;
    }
    // Try to parse other formats
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return "";
  }
  const [trialMode, setTrialMode] = useState<"days"|"end">(initialTrialMode);
  const initialVatRate = toNumber(price?.vatRate, 23);
  const initialNetAmount = toNumber(price?.amount, 0);
  const [form, setForm] = useState<Price & { trialPeriodType?: string }>({
    // In DB/API we store NET, but in this form we edit/display GROSS.
    amount: computeGrossFromNet(initialNetAmount, initialVatRate),
    currency: price?.currency ?? "PLN",
    interval: price?.interval ?? "ONE_TIME",
    isRecurring: price?.isRecurring ?? false,
    trialPeriodDays: toNumber(price?.trialPeriodDays, 0),
    trialPeriodEnd: toInputDateFormat(price?.trialPeriodEnd),
    trialPeriodType: price?.trialPeriodType ?? (initialTrialMode === "days" ? "DAYS" : "DATE"),
    vatRate: initialVatRate,
  });

  const toggleEdit = () => setIsEditing((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;
    if (type === "checkbox") {
      fieldValue = (e.target as HTMLInputElement).checked;
      if (name === "isRecurring") {
        if (!(e.target as HTMLInputElement).checked) {
          setForm((prev) => ({ ...prev, isRecurring: false, interval: "ONE_TIME", trialPeriodDays: 0, trialPeriodEnd: "" }));
          setTrialMode("days");
          return;
        } else {
          setForm((prev) => ({ ...prev, isRecurring: true, interval: prev.interval && prev.interval !== "ONE_TIME" ? prev.interval : "MONTH" }));
          return;
        }
      }
    } else if (name === "amount" || name === "vatRate" || name === "trialPeriodDays") {
      const numeric = Number(value);
      fieldValue = name === "amount" ? round2(numeric) : numeric;
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vatRateNumber = toNumber(form.vatRate, 0);
      const netAmount = round2(computeNetFromGross(toNumber(form.amount, 0), vatRateNumber));
      const payload: any = {
        // API expects NET amount; we let user edit GROSS.
        amount: netAmount,
        currency: form.currency,
        interval: form.interval,
        isRecurring: form.isRecurring,
        trialPeriodType: trialMode === "days" ? "DAYS" : "DATE",
        vatRate: vatRateNumber,
      };
      if (trialMode === "days" && form.trialPeriodDays && form.trialPeriodDays > 0) {
        payload.trialPeriodDays = form.trialPeriodDays;
      }
      if (trialMode === "end" && form.trialPeriodEnd) {
        payload.trialPeriodEnd = form.trialPeriodEnd;
      }
      const res = await fetch(`/api/educational-paths/${id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(t("epPrice.updated"));
      setIsEditing(false);
    } catch {
      toast.error(t("epPrice.error"));
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t("epPrice.title")}
        icon={DollarSign}
        status={{
          label: form.amount > 0 ? `${formatMoney(form.amount, form.currency, locale)} ${form.currency} ${t("epPrice.gross")}${form.isRecurring ? ` / ${intervalOptions.find(opt => opt.value === form.interval)?.label || form.interval}` : ''}` : t("epPrice.free"),
          variant: form.amount > 0 ? "default" : "outline",
          className: form.amount > 0 ? "bg-green-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t("epPrice.hint")}</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              t("epPrice.cancel")
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                {t("epPrice.edit")}
              </>
            )}
          </Button>
        </div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">{t("epPrice.grossAmount")}</label>
            <p className="text-xs text-muted-foreground mb-1">{t("epPrice.grossHint")}</p>
            <input
              type="number"
              min={0}
              step={0.01}
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">{t("epPrice.currency")}</label>
            <input
              type="text"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">{t("epPrice.vatRate")}</label>
            <select
              name="vatRate"
              value={form.vatRate}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            >
              <option value={0}>0%</option>
              <option value={23}>23%</option>
            </select>
          </div>
          <div className="form-group flex items-center gap-2">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={handleChange}
              id="isRecurring"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">{t("epPrice.recurring")}</label>
          </div>
          {form.isRecurring && (
            <>
              <div className="form-group">
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700">{t("epPrice.billingPeriod")}</label>
                <select
                  name="interval"
                  id="interval"
                  value={form.interval}
                  onChange={e => setForm(f => ({ ...f, interval: e.target.value as Price["interval"] }))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                >
                  {intervalOptions.filter(opt => opt.value !== "ONE_TIME").map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group flex gap-4 items-center mt-2">
                <label className="text-sm font-medium text-gray-700">{t("epPrice.trialMode")}</label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="trialMode" value="days" checked={trialMode === "days"} onChange={() => { setTrialMode("days"); setForm(f => ({ ...f, trialPeriodEnd: "", trialPeriodDays: f.trialPeriodDays ?? 0, trialPeriodType: "DAYS" })); }} />
                  {t("epPrice.trialDays")}
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="trialMode" value="end" checked={trialMode === "end"} onChange={() => { setTrialMode("end"); setForm(f => ({ ...f, trialPeriodDays: 0, trialPeriodEnd: f.trialPeriodEnd ?? "", trialPeriodType: "DATE" })); }} />
                  {t("epPrice.trialEndDate")}
                </label>
              </div>
              {trialMode === "days" && (
                <div className="form-group">
                  <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700">{t("epPrice.trialPeriodDays")}</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    name="trialPeriodDays"
                    value={form.trialPeriodDays !== undefined && form.trialPeriodDays > 0 ? form.trialPeriodDays : ""}
                    onChange={e => setForm(f => ({ ...f, trialPeriodDays: Number(e.target.value), trialPeriodEnd: "" }))}
                    placeholder={t("epPrice.eg")}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  />
                </div>
              )}
              {trialMode === "end" && (
                <div className="form-group">
                  <label htmlFor="trialPeriodEnd" className="block text-sm font-medium text-gray-700">{t("epPrice.trialPeriodEnd")}</label>
                  <input
                    type="date"
                    name="trialPeriodEnd"
                    value={form.trialPeriodEnd ?? ""}
                    onChange={e => setForm(f => ({ ...f, trialPeriodEnd: e.target.value, trialPeriodDays: 0 }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  />
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-x-2">
            <Button type="submit">
              {t("epPrice.save")}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className={`text-sm mt-2 ${Number(form.amount) === 0 ? "text-orange-700 font-semibold" : ""}`}>
            {Number(form.amount) === 0 ? (
              t("epPrice.freeLabel")
            ) : (
              <span className="font-semibold text-orange-700">
                {formatMoney(form.amount, form.currency, locale)} {form.currency}
                {form.isRecurring
                  ? `/ ${form.interval === "MONTH" ? t("epPrice.month") : form.interval === "YEAR" ? t("epPrice.year") : t("epPrice.oneTime").toLowerCase()}`
                  : ""}{" "}
                {t("epPrice.gross")}
              </span>
            )}
          </p>

          {Number(form.amount) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("epPrice.net")}: {formatMoney(computeNetFromGross(form.amount, toNumber(form.vatRate, 0)), form.currency, locale)} {form.currency} • VAT {toNumber(form.vatRate, 0)}%
            </p>
          )}
          {/* Only show trial period if valid */}
          {form.isRecurring && form.trialPeriodType === "DAYS" && form.trialPeriodDays !== undefined && form.trialPeriodDays > 0 && (
            <p className="text-xs text-orange-500 mt-1">{t("epPrice.trialDaysLabel").replace("{days}", String(form.trialPeriodDays))}</p>
          )}
          {form.isRecurring && form.trialPeriodType === "DATE" && form.trialPeriodEnd && form.trialPeriodEnd !== "1970-01-01" && (
            <p className="text-xs text-orange-500 mt-1">{t("epPrice.trialUntil")} {new Date(form.trialPeriodEnd).toLocaleDateString(locale === "en" ? "en-US" : "pl-PL")}</p>
          )}
        </>
      )}
      </FormCard>
    </div>
  );
}