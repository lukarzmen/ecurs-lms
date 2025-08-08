"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface PurchaseCardProps {
    userId: string;
    courseId: string;
}

const PurchaseCard = ({ userId, courseId }: PurchaseCardProps & { promoCode?: string }) => {
    const [loading, setLoading] = useState(false);
    const [courseData, setCourseData] = useState<any>(null);
    const [permResult, setPermResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState<string>("");
    const [discount, setDiscount] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<string>("");
    const router = useRouter();
    const [promoError, setPromoError] = useState<string>("");

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

    // Validate promo code on mount if present and courseData is loaded
    useEffect(() => {
        async function validateOnMount() {
            if (promoCode && courseData && courseData.price > 0) {
                try {
                    const res = await fetch(`/api/courses/${courseId}/promocode/${promoCode}`);
                    const data = await res.json();
                    if (res.ok && typeof data.discount === "number" && data.discount > 0) {
                        setDiscount(data.discount);
                        const discounted = courseData.price * (1 - data.discount / 100);
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
    }, [courseData, courseId]);

    // Only check promo code when user clicks button
    const checkPromoCode = async () => {
        setPromoError("");
        if (!promoCode) {
            setPromoError("Wpisz kod promocyjny");
            setDiscount(0);
            setFinalPrice("");
            return;
        }
        if (courseData && courseData.price > 0) {
            try {
                const res = await fetch(`/api/courses/${courseId}/promocode/${promoCode}`);
                const data = await res.json();
                if (res.ok && typeof data.discount === "number" && data.discount > 0) {
                    setDiscount(data.discount);
                    const discounted = courseData.price * (1 - data.discount / 100);
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
                const permResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/permissions`,
                    {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        cache: 'no-store',
                        body: JSON.stringify({ courseId, userId }),
                    }
                );
                if (!permResponse.ok) {
                    setError("Sprawdzanie uprawnień nie powiodło się. Spróbuj ponownie później.");
                    return;
                }
                const perm = await permResponse.json();
                setPermResult(perm);

                if (!perm.hasPurchase) {
                    const courseResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`,
                        { method: 'GET', cache: 'no-store' }
                    );
                    if (!courseResponse.ok) {
                        setError("Nie można pobrać danych kursu. Spróbuj ponownie później.");
                        return;
                    }
                    setCourseData(await courseResponse.json());
                }
            } catch (err) {
                setError("Wystąpił błąd podczas ładowania strony.");
            }
        };
        fetchData();
    }, [courseId, userId, router]);

    useEffect(() => {
        if (permResult?.hasPurchase) {
            router.replace(`/courses/${courseId}`);
        }
    }, [permResult, courseId, router]);

    const handleBuy = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promoCode }),
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

    if (error) {
        return <div className="text-red-600 text-center mt-10">{error}</div>;
    }

    if (!permResult) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="animate-spin w-8 h-8 text-orange-700" />
            </div>
        );
    }

    if (!permResult.hasPurchase && courseData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] mt-8">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full flex flex-col items-center">
                    <Image
                        src={courseData.imageId ? `/api/image/${courseData.imageId}` : "/logo.png"}
                        alt={courseData.title}
                        width={200}
                        height={200}
                        className="rounded mb-4 object-cover"
                    />
                    <h2 className="text-xl font-bold mb-2">{courseData.title}</h2>
                    <div className="text-lg font-semibold text-orange-700 mb-2">
                        {courseData.price === 0
                            ? "Darmowy"
                            : discount > 0 && finalPrice
                                ? <><span className="line-through mr-2 text-gray-500">{courseData.price} PLN</span><span className="text-green-700">{finalPrice} PLN</span></>
                                : `${courseData.price} PLN`}
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

export default PurchaseCard;