"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareDialogProps {
  courseIdNumber: number;
  apiUrl: string;
  defaultDescription?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ courseIdNumber, apiUrl }) => {
  const [open, setOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodes, setPromoCodes] = useState<{ id: number; code: string; discount: number; description?: string; expirationDate?: string }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [basePrice, setBasePrice] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");

  useEffect(() => {
    async function fetchPromoCodes() {
      try {
        const res = await fetch(`/api/courses/${courseIdNumber}/promocode`);
        const data = await res.json();
        setPromoCodes(data);
      } catch {
        setPromoCodes([]);
      }
    }
    fetchPromoCodes();
  }, [courseIdNumber]);

  useEffect(() => {
    async function fetchDiscount() {
      if (promoCode) {
        try {
          const res = await fetch(`/api/courses/${courseIdNumber}/promocode/${promoCode}`);
          const data = await res.json();
          if (res.ok && typeof data.discount === "number") {
            setDiscount(data.discount);
          } else {
            setDiscount(0);
          }
        } catch {
          setDiscount(0);
        }
      } else {
        setDiscount(0);
      }
    }
    fetchDiscount();
  }, [promoCode, courseIdNumber]);

  useEffect(() => {
  const params = new URLSearchParams();
  if (promoCode) params.append("promoCode", promoCode);
  if (desc) params.append("description", desc);
  const link = `${apiUrl}/courses/${courseIdNumber}/enroll${params.toString() ? `?${params.toString()}` : ""}`;
  setShareLink(link);
  }, [promoCode, discount, desc, apiUrl, courseIdNumber]);

  useEffect(() => {
    if (basePrice && !isNaN(Number(basePrice))) {
      const priceNum = Number(basePrice);
      const discounted = discount ? priceNum * (1 - discount / 100) : priceNum;
      setFinalPrice(discounted.toFixed(2));
    } else {
      setFinalPrice("");
    }
  }, [basePrice, discount]);


  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Udostępnij kurs
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Udostępnij kurs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1 mt-2">Kod promocyjny</label>
            <select
              className="w-full border rounded px-2 py-2 text-sm"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
            >
              <option value="">Bez kodu promocyjnego</option>
              {promoCodes.map(pc => (
                <option key={pc.id} value={pc.code}>
                  {pc.code} - {pc.discount}%
                  {pc.description ? ` (${pc.description})` : ""}
                  {pc.expirationDate ? ` ważny do ${new Date(pc.expirationDate).toISOString().slice(0, 10)}` : " bez terminu"}
                </option>
              ))}
            </select>
            {basePrice && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Cena po rabacie</label>
                <Input value={finalPrice} readOnly className="w-full" />
              </div>
            )}
            {shareLink && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Link do kursu</label>
                <Input value={shareLink} readOnly className="w-full" />
                <Button
                  type="button"
                  className="mt-2 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("Link skopiowany!");
                  }}
                >
                  Kopiuj link
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
