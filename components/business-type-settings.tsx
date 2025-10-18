"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, FileText, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface BusinessTypeData {
  businessType: "individual" | "company";
  companyName?: string;
  taxId?: string;
  requiresVatInvoices?: boolean;
}

export function BusinessTypeSettings() {
  const [businessData, setBusinessData] = useState<BusinessTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BusinessTypeData>({
    businessType: "individual",
    companyName: "",
    taxId: "",
    requiresVatInvoices: false
  });

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/user/business-type");
      if (response.ok) {
        const data = await response.json();
        setBusinessData(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast.error("Nie udało się pobrać danych o typie działalności");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.businessType === "company" && (!formData.companyName || !formData.taxId)) {
      toast.error("Dla firmy wymagana jest nazwa firmy i NIP");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/user/business-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zapisać danych");
      }

      const result = await response.json();
      setBusinessData(result);
      setIsEditing(false);
      toast.success("Dane zostały zaktualizowane");
    } catch (error) {
      console.error("Error updating business data:", error);
      toast.error("Nie udało się zapisać danych");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !businessData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Typ działalności
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Typ działalności
        </CardTitle>
        <CardDescription>
          Konfiguracja typu działalności wpływa na sposób przetwarzania płatności i wystawiania dokumentów
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <>
            <div className="flex items-center gap-2">
              {businessData?.businessType === "company" ? (
                <>
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Firma
                  </Badge>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Osoba fizyczna
                  </Badge>
                </>
              )}
            </div>

            {businessData?.businessType === "company" && (
              <div className="space-y-2 pl-6 border-l-2 border-blue-200">
                <div>
                  <span className="text-sm font-medium text-gray-700">Nazwa firmy:</span>
                  <p className="text-gray-900">{businessData.companyName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">NIP:</span>
                  <p className="text-gray-900">{businessData.taxId}</p>
                </div>
                {businessData.requiresVatInvoices && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      Wystawianie faktur VAT: Włączone
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Edytuj typ działalności
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="businessType"
                  value="individual"
                  checked={formData.businessType === "individual"}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    businessType: e.target.value as "individual" | "company",
                    companyName: "",
                    taxId: "",
                    requiresVatInvoices: false
                  }))}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Osoba fizyczna (JDG)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Prowadzisz kursy jako osoba fizyczna prowadząca działalność gospodarczą
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="businessType"
                  value="company"
                  checked={formData.businessType === "company"}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    businessType: e.target.value as "individual" | "company" 
                  }))}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Firma (spółka)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Prowadzisz kursy jako firma - wymagane faktury VAT
                  </div>
                </div>
              </label>
            </div>

            {formData.businessType === "company" && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Dane firmy
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa firmy *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="np. Przykładowa Sp. z o.o."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIP *
                  </label>
                  <input
                    type="text"
                    value={formData.taxId || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="np. 1234567890"
                  />
                </div>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresVatInvoices || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresVatInvoices: e.target.checked }))}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">Wymagam wystawiania faktur VAT</div>
                    <div className="text-gray-600">Będę wystawiać faktury VAT swoim uczniom</div>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (formData.businessType === "company" && (!formData.companyName || !formData.taxId))}
                className="flex-1"
              >
                {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(businessData || {
                    businessType: "individual",
                    companyName: "",
                    taxId: "",
                    requiresVatInvoices: false
                  });
                }}
                variant="outline"
                disabled={isLoading}
              >
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}