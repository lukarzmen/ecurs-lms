"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/ui/form-card";
import { Pencil, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

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

const intervalOptions = [
  { value: "ONE_TIME", label: "Jednorazowo" },
  { value: "MONTH", label: "Miesięcznie" },
  { value: "YEAR", label: "Rocznie" },
];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function round2(value: number) {
  if (!Number.isFinite(value)) return value;
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

export default function PriceForm({ price, courseId }: { price: Price; courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);
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
      if (name === "isRecurring" && !(e.target as HTMLInputElement).checked) {
        setForm((prev) => ({ ...prev, isRecurring: false, interval: "ONE_TIME", trialPeriodDays: 0, trialPeriodEnd: "" }));
        setTrialMode("days");
        return;
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
      const res = await fetch(`/api/courses/${courseId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Zaktualizowano cenę");
      setIsEditing(false);
    } catch {
      toast.error("Coś poszło nie tak");
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title="Cena kursu"
        icon={DollarSign}
        status={{
          label: isEditing ? "Edycja" : (Number(form.amount) === 0 ? "Darmowy" : "Płatny"),
          variant: isEditing ? "secondary" : (Number(form.amount) === 0 ? "outline" : "default"),
          className: isEditing ? "bg-blue-500 text-white" : (Number(form.amount) === 0 ? "" : "bg-green-500")
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Ustawienia cenowe kursu</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              <>Anuluj</>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </>
            )}
          </Button>
        </div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">Kwota brutto</label>
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
            <label className="block text-sm font-medium text-gray-700">Waluta</label>
            <input
              type="text"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">Stawka VAT</label>
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
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">Płatność cykliczna</label>
          </div>
          {form.isRecurring && (
            <>
              <div className="form-group">
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700">Okres rozliczenia</label>
                <select
                  name="interval"
                  id="interval"
                  value={form.interval}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                >
                  {intervalOptions.filter(opt => opt.value !== "ONE_TIME").map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group flex gap-4 items-center mt-2">
                <label className="text-sm font-medium text-gray-700">Tryb okresu próbnego:</label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="trialMode" value="days" checked={trialMode === "days"} onChange={() => { setTrialMode("days"); setForm(f => ({ ...f, trialPeriodEnd: "", trialPeriodDays: f.trialPeriodDays ?? 0, trialPeriodType: "DAYS" })); }} />
                  Dni
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="trialMode" value="end" checked={trialMode === "end"} onChange={() => { setTrialMode("end"); setForm(f => ({ ...f, trialPeriodDays: 0, trialPeriodEnd: f.trialPeriodEnd ?? "", trialPeriodType: "DATE" })); }} />
                  Data zakończenia
                </label>
              </div>
              {trialMode === "days" && (
                <div className="form-group">
                  <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700">Okres próbny (dni)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    name="trialPeriodDays"
                    value={form.trialPeriodDays ?? 0}
                    onChange={e => setForm(f => ({ ...f, trialPeriodDays: Number(e.target.value), trialPeriodEnd: "" }))}
                    placeholder="np. 7"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  />
                </div>
              )}
              {trialMode === "end" && (
                <div className="form-group">
                  <label htmlFor="trialPeriodEnd" className="block text-sm font-medium text-gray-700">Data zakończenia okresu próbnego</label>
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
            <button type="submit" className="bg-orange-600 text-white font-semibold py-2 px-4 rounded-md">
              Zapisz
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className={`text-sm mt-2 ${Number(form.amount) === 0 ? "text-orange-700 font-semibold" : ""}`}>
            {Number(form.amount) === 0 ? (
              "Darmowy"
            ) : (
              <span className="font-semibold text-orange-700">
                {formatMoney(form.amount, form.currency)} {form.currency}
                {form.isRecurring
                  ? ` / ${form.interval === "MONTH" ? "msc" : form.interval === "YEAR" ? "rok" : "jednorazowo"}`
                  : ""}{" "}
                brutto
              </span>
            )}
          </p>

          {Number(form.amount) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Netto: {formatMoney(computeNetFromGross(form.amount, toNumber(form.vatRate, 0)), form.currency)} {form.currency} • VAT {toNumber(form.vatRate, 0)}%
            </p>
          )}
          {/* Only show trial period if valid */}
          {form.isRecurring && form.trialPeriodType === "DAYS" && form.trialPeriodDays && form.trialPeriodDays > 0 && (
            <p className="text-xs text-orange-500 mt-1">Okres próbny: {form.trialPeriodDays} dni</p>
          )}
          {form.isRecurring && form.trialPeriodType === "DATE" && form.trialPeriodEnd && form.trialPeriodEnd !== "1970-01-01" && (
            <p className="text-xs text-orange-500 mt-1">Okres próbny do {new Date(form.trialPeriodEnd).toLocaleDateString()}</p>
          )}
        </>
      )}
      </FormCard>
    </div>
  );
}