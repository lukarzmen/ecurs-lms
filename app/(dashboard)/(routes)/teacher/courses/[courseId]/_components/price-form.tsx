"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

// New price structure: amount, currency, interval, isRecurring
type Price = {
  amount: number;
  currency: string;
  interval?: "ONE_TIME" | "MONTH" | "YEAR";
  isRecurring?: boolean;
  trialPeriodDays?: number;
};

const intervalOptions = [
  { value: "ONE_TIME", label: "Jednorazowo" },
  { value: "MONTH", label: "Miesięcznie" },
  { value: "YEAR", label: "Rocznie" },
];

export default function PriceForm({ price, courseId }: { price: Price; courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Price>({
    amount: price?.amount ?? 0,
    currency: price?.currency ?? "PLN",
    interval: price?.interval ?? "ONE_TIME",
    isRecurring: price?.isRecurring ?? false,
    trialPeriodDays: price?.trialPeriodDays ?? 0,
  });

  const toggleEdit = () => setIsEditing((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;
    if (type === "checkbox") {
      fieldValue = (e.target as HTMLInputElement).checked;
      if (name === "isRecurring" && !(e.target as HTMLInputElement).checked) {
        setForm((prev) => ({ ...prev, isRecurring: false, interval: "ONE_TIME" }));
        return;
      }
    } else if (name === "amount") {
      fieldValue = Number(value);
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/courses/${courseId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          currency: form.currency,
          interval: form.interval,
          isRecurring: form.isRecurring,
          trialPeriodDays: form.trialPeriodDays,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Zaktualizowano cenę");
      setIsEditing(false);
    } catch {
      toast.error("Coś poszło nie tak");
    }
  };

  return (
    <div className="mt-6 border bg-orange-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Cena kursu
        <Button onClick={toggleEdit} variant="ghost">
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
            <label className="block text-sm font-medium text-gray-700">Kwota</label>
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
              <div className="form-group">
                <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700">Okres próbny (dni)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  name="trialPeriodDays"
                  value={form.trialPeriodDays}
                  onChange={handleChange}
                  placeholder="np. 7"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-x-2">
            <button type="submit" className="bg-orange-600 text-white font-semibold py-2 px-4 rounded-md">
              Zapisz
            </button>
          </div>
        </form>
      ) : (
        <p className={`text-sm mt-2 ${Number(form.amount) === 0 ? "text-orange-700 font-semibold" : ""}`}>
          {Number(form.amount) === 0
            ? "Darmowy"
            : <span className="font-semibold text-orange-700">{form.amount} {form.currency} {form.isRecurring ? `/ ${form.interval === "MONTH" ? "msc" : form.interval === "YEAR" ? "rok" : "jednorazowo"}` : ""}</span>}
        </p>
      )}
    </div>
  );
}