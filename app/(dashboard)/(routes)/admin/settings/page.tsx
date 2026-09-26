"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Percent } from "lucide-react";

interface CommissionConfig {
  commissionRatePercent: number;
  isActive: boolean;
  updatedAt: string | null;
}

const AdminSettingsPage = () => {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/commission-config");
        if (response.status === 403) {
          setForbidden(true);
          return;
        }
        if (response.ok) {
          const data: CommissionConfig = await response.json();
          setConfig(data);
          setRateInput(String(data.commissionRatePercent));
        } else {
          toast.error("Nie udało się pobrać konfiguracji prowizji");
        }
      } catch (error) {
        console.error("[ADMIN_SETTINGS] load error", error);
        toast.error("Nie udało się pobrać konfiguracji prowizji");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const parsed = Number(rateInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 100) {
      toast.error("Podaj prawidłową wartość procentową (0-99.99)");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/admin/commission-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRatePercent: parsed }),
      });
      if (response.status === 403) {
        setForbidden(true);
        return;
      }
      if (!response.ok) {
        toast.error("Nie udało się zapisać prowizji");
        return;
      }
      const data: CommissionConfig = await response.json();
      setConfig(data);
      setRateInput(String(data.commissionRatePercent));
      toast.success("Stawka prowizji zaktualizowana");
    } catch (error) {
      console.error("[ADMIN_SETTINGS] save error", error);
      toast.error("Nie udało się zapisać prowizji");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;
  }

  if (forbidden) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Brak dostępu</CardTitle>
            <CardDescription>Ta strona jest dostępna tylko dla administratorów platformy.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Prowizja platformy
          </CardTitle>
          <CardDescription>
            Procent pobierany automatycznie (przez Stripe Connect) od każdej sprzedaży kursu lub ścieżki
            edukacyjnej, zamiast stałego abonamentu nauczyciela. Zmiana obowiązuje natychmiast dla nowych
            transakcji.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Stawka prowizji (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              min={0}
              max={99.99}
              step={0.1}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              disabled={isSaving}
              className="max-w-[160px]"
            />
          </div>
          {config?.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Ostatnia zmiana: {new Date(config.updatedAt).toLocaleString("pl-PL")}
            </p>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
