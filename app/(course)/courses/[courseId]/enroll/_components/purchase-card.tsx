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

const PurchaseCard = ({ userId, courseId }: PurchaseCardProps) => {
    const [loading, setLoading] = useState(false);
    const [courseData, setCourseData] = useState<any>(null);
    const [permResult, setPermResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
                    <div className="text-lg font-semibold text-orange-700 mb-4">
                        {courseData.price === 0
                            ? "Darmowy"
                            : `${courseData.price} PLN`}
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

export default PurchaseCard;