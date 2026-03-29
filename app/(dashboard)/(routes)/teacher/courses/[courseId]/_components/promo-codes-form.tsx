"use client";
import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";
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
  const { t } = useI18n();

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
      toast.success(t('promoForm.promoAdded'));
      setIsModalOpen(false);
      setCode("");
      setDiscount("");
      setDescription("");
      setExpirationDate("");
      fetchPromoCodes();
    } catch (error) {
      toast.error(t('promoForm.addError'));
    }
    setLoading(false);
  };

  const handleDeletePromo = async (code: string) => {
    setLoading(true);
    try {
      await axios.delete(`/api/courses/${courseId}/promocode/${code}`);
      toast.success(t('promoForm.promoDeleted'));
      fetchPromoCodes();
    } catch (error) {
      toast.error(t('promoForm.deleteError'));
    }
    setLoading(false);
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t('promoForm.promoCodes')}
        icon={Percent}
        status={{
          label: promoCodes.length > 0 ? t('promoForm.codesCount').replace('{count}', String(promoCodes.length)) : t('promoForm.noCodes'),
          variant: promoCodes.length > 0 ? "default" : "outline",
          className: promoCodes.length > 0 ? "bg-green-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t('promoForm.discountsForParticipants')}</span>
          <Button onClick={() => setIsModalOpen(true)} variant="ghost" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('promoForm.addCode')}
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
                      {promo.expirationDate ? t('promoForm.validUntil').replace('{date}', new Date(promo.expirationDate).toISOString().slice(0, 10)) : t('promoForm.noExpiry')}
                    </span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePromo(promo.code)} disabled={loading}>
                    {t('promoForm.delete')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <FormSection variant="warning">
              <p>
                <strong>{t('promoForm.noCodesTitle')}</strong><br />
                {t('promoForm.noCodesHint')}
              </p>
            </FormSection>
          )}
        </div>
      </FormCard>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('promoForm.addPromoCode')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder={t('promoForm.codePlaceholder')}
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder={t('promoForm.discountPlaceholder')}
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder={t('promoForm.descPlaceholder')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder={expirationDate ? t('promoForm.expirationPlaceholder') : t('promoForm.noExpiry')}
              type="date"
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleAddPromo} type="button" className="w-full" disabled={loading || !code || !discount}>
              {t('promoForm.addBtn')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>{t('courseForm.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
