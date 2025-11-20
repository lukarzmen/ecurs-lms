"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface PurchaseCardProps {
    userId: string;
    educationalPathId: string;
}

const EduPathPurchaseCard = ({ userId, educationalPathId }: PurchaseCardProps & { promoCode?: string }) => {
    const [loading, setLoading] = useState(false);
    const [pathData, setPathData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState<string>("");
    const [discount, setDiscount] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<string>("");
    const router = useRouter();
    const [promoError, setPromoError] = useState<string>("");
    const [joinLoading, setJoinLoading] = useState(false);
    const [requireVatInvoice, setRequireVatInvoice] = useState(false);

    // Initialize promoCode from prop or URL parameter
    useEffect(() => {
        let initialCode = "";
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const urlCode = params.get("promoCode");
            if (promoCode) {
                initialCode = promoCode;
            } else if (urlCode) {
                initialCode = urlCode;
            }
        }
        if (initialCode) {
            setPromoCode(initialCode);
        }
    }, [promoCode]);

    useEffect(() => {
        async function validateOnMount() {
            const priceAmount = pathData?.price?.amount !== undefined ? parseFloat(pathData.price.amount) : 0;
            if (promoCode && pathData && priceAmount > 0) {
                try {
                    const res = await fetch(`/api/educational-paths/${educationalPathId}/promocode/${promoCode}`);
                    const data = await res.json();
                    if (res.ok && typeof data.discount === "number" && data.discount > 0) {
                        setDiscount(data.discount);
                        const discounted = priceAmount * (1 - data.discount / 100);
                        setFinalPrice(discounted.toFixed(2));
                        setPromoError("");
                    } else {
                        setDiscount(0);
                        setFinalPrice("");
                        setPromoError("Nieprawidłowy kod promocyjny");
                    }
                } catch {
                    setDiscount(0);
                    setFinalPrice("");
                    setPromoError("Błąd podczas sprawdzania kodu");
                }
            }
        }
        validateOnMount();
    }, [pathData, educationalPathId, promoCode]);

    // Only check promo code when user clicks button
    const checkPromoCode = async () => {
        setPromoError("");
        if (!promoCode) {
            setPromoError("Wpisz kod promocyjny");
            setDiscount(0);
            setFinalPrice("");
            return;
        }
        const priceAmount = pathData?.price?.amount ?? 0;
        if (pathData && priceAmount > 0) {
            try {
                const res = await fetch(`/api/educational-paths/${educationalPathId}/promocode/${promoCode}`);
                const data = await res.json();
                if (res.ok && typeof data.discount === "number" && data.discount > 0) {
                    setDiscount(data.discount);
                    const discounted = priceAmount * (1 - data.discount / 100);
                    setFinalPrice(discounted.toFixed(2));
                } else {
                    setDiscount(0);
                    setFinalPrice("");
                    setPromoError("Nieprawidłowy kod promocyjny");
                }
            } catch {
                setDiscount(0);
                setFinalPrice("");
                setPromoError("Błąd podczas sprawdzania kodu");
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pathResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/educational-paths/${educationalPathId}`,
                    { method: 'GET', cache: 'no-store' }
                );
                if (!pathResponse.ok) {
                    setError("Nie można pobrać danych ścieżki. Spróbuj ponownie później.");
                    return;
                }
                setPathData(await pathResponse.json());
            } catch (err) {
                setError("Wystąpił błąd podczas ładowania strony.");
            }
        };
        fetchData();
    }, [educationalPathId]);

    // Removed permission redirect effect

    const handleBuy = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/educational-paths/${educationalPathId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promoCode, vatInvoiceRequested: requireVatInvoice }),
            });
            if (!res.ok) throw new Error("Checkout failed");
            const data = await res.json();
            if (data.sessionUrl) {
                window.location.assign(data.sessionUrl);
            } else {
                throw new Error("Brak adresu przekierowania.");
            }
        } catch (err) {
            console.error("Błąd podczas przekierowania do płatności:", err);
            toast.error("Błąd podczas przekierowania do płatności.");
        } finally {
            setLoading(false);
        }
    };

    if (pathData) {
    const priceAmount = pathData?.price?.amount ?? 0;
    const priceCurrency = pathData?.price?.currency || "PLN";
    const isRecurring = pathData?.price?.isRecurring;
    const interval = pathData?.price?.interval;
    const trialPeriodDays = pathData?.price?.trialPeriodDays;
    const trialPeriodEnd = pathData?.price?.trialPeriodEnd;
    const trialPeriodType = pathData?.price?.trialPeriodType;
    if (priceAmount == 0) {
        // Free educational path appearance with permission check and loading
        const handleJoinFreePath = async () => {
            setJoinLoading(true);
            try {
                const permResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/permissions`,
                    {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        cache: 'no-store',
                        body: JSON.stringify({ educationalPathId, userId }),
                    }
                );
                if (!permResponse.ok) {
                    setError("Sprawdzanie uprawnień nie powiodło się. Spróbuj ponownie później.");
                    setJoinLoading(false);
                    return;
                }
                const perm = await permResponse.json();
                if (perm.hasPurchase) {
                    router.push(`/educational-path/${educationalPathId}`);
                } else {
                    setError("Brak uprawnień do dołączenia do ścieżki.");
                }
            } catch (err) {
                setError("Wystąpił błąd podczas sprawdzania uprawnień.");
            } finally {
                setJoinLoading(false);
            }
        };
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] mt-8">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full flex flex-col items-center">
                    <Image
                        src={pathData.imageId ? `/api/image/${pathData.imageId}` : "/logo.png"}
                        alt={pathData.title}
                        width={200}
                        height={200}
                        className="rounded mb-4 object-cover"
                    />
                    <h2 className="text-xl font-bold mb-2">{pathData.title}</h2>
                    <div className="text-lg font-semibold text-green-700 mb-4">Darmowa ścieżka edukacyjna</div>
                    <button
                        type="button"
                        className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition flex items-center justify-center"
                        onClick={handleJoinFreePath}
                        disabled={joinLoading}
                    >
                        {joinLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Dołącz do ścieżki
                    </button>
                </div>
            </div>
        );
    }
    // Paid educational path appearance
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full flex flex-col items-center">
                <Image
                    src={pathData.imageId ? `/api/image/${pathData.imageId}` : "/logo.png"}
                    alt={pathData.title}
                    width={200}
                    height={200}
                    className="rounded mb-4 object-cover"
                />
                <h2 className="text-xl font-bold mb-2">{pathData.title}</h2>
                <div className="text-lg font-semibold text-orange-700 mb-2">
                    {discount > 0 && finalPrice
                        ? <><span className="line-through mr-2 text-gray-500">{priceAmount} {priceCurrency}{isRecurring && interval ? ` / ${interval === 'MONTH' ? 'miesiąc' : interval === 'YEAR' ? 'rok' : interval.toLowerCase()}` : ""}</span><span className="text-green-700">{finalPrice} {priceCurrency}{isRecurring && interval ? ` / ${interval === 'MONTH' ? 'miesiąc' : interval === 'YEAR' ? 'rok' : interval.toLowerCase()}` : ""}</span>{isRecurring && trialPeriodType === 'DAYS' && trialPeriodDays && trialPeriodDays > 0 ? (<span className="block text-xs text-orange-500 font-normal">Okres próbny: {trialPeriodDays} dni</span>) : null}{isRecurring && trialPeriodType === 'DATE' && trialPeriodEnd ? (<span className="block text-xs text-orange-500 font-normal">Okres próbny do {new Date(trialPeriodEnd).toLocaleDateString()}</span>) : null}</>
                        : <><>{priceAmount} {priceCurrency}{isRecurring && interval ? ` / ${interval === 'MONTH' ? 'miesiąc' : interval === 'YEAR' ? 'rok' : interval.toLowerCase()}` : ""}</>{isRecurring && trialPeriodType === 'DAYS' && trialPeriodDays && trialPeriodDays > 0 ? (<span className="block text-xs text-orange-500 font-normal">Okres próbny: {trialPeriodDays} dni</span>) : null}{isRecurring && trialPeriodType === 'DATE' && trialPeriodEnd ? (<span className="block text-xs text-orange-500 font-normal">Okres próbny do {new Date(trialPeriodEnd).toLocaleDateString()}</span>) : null}</>}
                </div>
                {finalPrice && discount > 0 && (
                    <div className="text-md font-semibold text-green-700 mb-2">
                        {discount}% taniej
                    </div>
                )}
                <div className="w-full flex gap-2 mb-2">
                    <input
                        type="text"
                        placeholder="Kod promocyjny"
                        value={promoCode}
                        onChange={e => {
                            setPromoCode(e.target.value);
                            setPromoError("");
                            setDiscount(0);
                            setFinalPrice("");
                        }}
                        className={`w-full px-3 py-2 border rounded ${promoError ? 'border-red-500' : (discount > 0 ? 'border-green-500' : '')}`}
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="bg-gray-200 text-orange-700 px-4 py-2 rounded hover:bg-gray-300 transition flex items-center justify-center"
                        onClick={checkPromoCode}
                        disabled={loading}
                    >
                        Sprawdź kod
                    </button>
                </div>
                {promoError && (
                    <div className="text-sm text-red-600 mb-2 w-full text-left">{promoError}</div>
                )}
                <div className="w-full mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={requireVatInvoice}
                            onChange={(e) => setRequireVatInvoice(e.target.checked)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            disabled={loading}
                        />
                        <span className="text-sm text-gray-700">
                            Chcę otrzymać fakturę VAT
                        </span>
                    </label>
                    {requireVatInvoice && (
                        <p className="text-xs text-gray-500 mt-1">
                            Faktura VAT zostanie automatycznie wygenerowana przez Stripe i wysłana na Twój adres e-mail.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    className="w-full bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition flex items-center justify-center"
                    onClick={handleBuy}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Kup dostęp przez Stripe
                </button>
            </div>
        </div>
    );
    }

    return null;
};

export default EduPathPurchaseCard;