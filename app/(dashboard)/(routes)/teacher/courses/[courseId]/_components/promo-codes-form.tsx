"use client";
import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import toast from "react-hot-toast";
import { PlusCircle, Percent } from "lucide-react";

interface PromoCode {
  id: number;
  code: string;
  discount: number;
  description?: string;
  expirationDate?: string;
}

interface PromoCodesFormProps {
  courseId: string;
}

export const PromoCodesForm: React.FC<PromoCodesFormProps> = ({ courseId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  const fetchPromoCodes = React.useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/promocode`);
      setPromoCodes(res.data);
    } catch {
      setPromoCodes([]);
    }
  }, [courseId]);

  React.useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleAddPromo = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/courses/${courseId}/promocode`, {
        code,
        discount: Number(discount),
        description,
        expirationDate,
      });
      toast.success("Kod promocyjny dodany");
      setIsModalOpen(false);
      setCode("");
      setDiscount("");
      setDescription("");
      setExpirationDate("");
      fetchPromoCodes();
    } catch (error) {
      toast.error("Błąd dodawania kodu");
    }
    setLoading(false);
  };

  const handleDeletePromo = async (code: string) => {
    setLoading(true);
    try {
      await axios.delete(`/api/courses/${courseId}/promocode/${code}`);
      toast.success("Kod promocyjny usunięty");
      fetchPromoCodes();
    } catch (error) {
      toast.error("Błąd usuwania kodu");
    }
    setLoading(false);
  };

  return (
    <div className="mt-6">
      <FormCard
        title="Kody promocyjne"
        icon={Percent}
        status={{
          label: promoCodes.length > 0 ? `${promoCodes.length} kodów` : "Brak kodów",
          variant: promoCodes.length > 0 ? "default" : "outline",
          className: promoCodes.length > 0 ? "bg-green-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Zniżki dla uczestników</span>
          <Button onClick={() => setIsModalOpen(true)} variant="ghost" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Dodaj kod
          </Button>
        </div>
        <div>
          {promoCodes && promoCodes.length > 0 ? (
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between bg-muted/50 rounded p-3">
                  <div>
                    <span className="font-bold">{promo.code}</span> - {promo.discount}%
                    {promo.description && <span className="ml-2 text-sm text-muted-foreground">{promo.description}</span>}
                    <span className="ml-2 text-xs text-muted-foreground block mt-1">
                      {promo.expirationDate ? `Ważny do: ${new Date(promo.expirationDate).toISOString().slice(0, 10)}` : 'Bez terminu'}
                    </span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePromo(promo.code)} disabled={loading}>
                    Usuń
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <FormSection variant="warning">
              <p>
                <strong>Brak kodów promocyjnych</strong><br />
                Dodaj kody promocyjne aby zaoferować zniżki
              </p>
            </FormSection>
          )}
        </div>
      </FormCard>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj kod promocyjny</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Kod promocyjny"
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Zniżka (%)"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Opis zniżki (opcjonalnie)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder={expirationDate ? "Data wygaśnięcia (YYYY-MM-DD)" : "Bez terminu"}
              type="date"
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleAddPromo} type="button" className="w-full" disabled={loading || !code || !discount}>
              Dodaj
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>Anuluj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
