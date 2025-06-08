"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function PriceForm({ price, courseId }: { price: number; courseId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(price);

  const toggleEdit = () => setIsEditing((v) => !v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPrice(Number(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting price:", currentPrice);
    try {
      const res = await fetch(`/api/courses/${courseId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: currentPrice }),
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
            <label className="block text-sm font-medium text-gray-700">Cena (PLN)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={currentPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
            />
            </div>
          <div className="flex items-center gap-x-2">
            <button type="submit" className="bg-orange-600 text-white font-semibold py-2 px-4 rounded-md">
              Zapisz
            </button>
          </div>
        </form>
      ) : (
        <p className={`text-sm mt-2 ${Number(currentPrice) === 0 ? "text-orange-700 font-semibold" : ""}`}>
          {Number(currentPrice) === 0
            ? "Darmowy"
            : <span className="font-semibold text-orange-700">{currentPrice} PLN</span>}
        </p>
      )}
    </div>
  );
}