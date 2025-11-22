"use client";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import { IconBadge } from "../icon-badge";
import { useState } from "react";

interface BaseCourseCardProps {
    id: number;
    title: string;
    imageId: string;
    author: string;
    category: string;
}

interface MarketplaceCourseCardProps extends BaseCourseCardProps {
    price?: number | null;
    currency?: string | null;
    isRecurring?: boolean;
    interval?: string | null;
    trialPeriodDays?: number | null;
    trialPeriodEnd?: string | null;
    trialPeriodType?: string | null; // "DAYS" or "DATE"
    enrolled?: boolean;
    type: "educationalPath" | "course" | null;
    vatRate?: number;
}

export interface CourseInfoCardProps extends BaseCourseCardProps {
    modulesCount: number;
    isCompleted?: boolean;
    type?: "educationalPath" | "course" | null;
}

export function MarketplaceCourseCard({
    id,
    title,
    imageId,
    author,
    category,
    price,
    currency,
    isRecurring,
    interval,
    trialPeriodDays,
    trialPeriodEnd,
    trialPeriodType,
    enrolled = true,
    type,
    vatRate = 23
}: MarketplaceCourseCardProps) {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png";
    const [isImageLoading, setIsImageLoading] = useState(true);
    const linkHref = type === "educationalPath"
        ? `/educational-paths/${id}/enroll`
        : `/courses/${id}/enroll`;
    
    // Calculate gross price (with VAT)
    const priceGross = price && price > 0 ? price * (1 + vatRate / 100) : price;

    // Card style differentiation
    const cardBg = "bg-white border-gray-300";
    const titleColor = type === "educationalPath" ? "text-orange-700" : "text-blue-700";
    // Info line below image
    const infoLine = type === "educationalPath"
        ? <div className="w-full text-xs font-semibold text-orange-700 py-1">Ścieżka edukacyjna</div>
        : <div className="w-full text-xs font-semibold text-blue-700 py-1">Kurs</div>;

    return (
        <Link href={linkHref}>
            <div className={`group hover:shadow-lg transition overflow-hidden border rounded-lg p-3 h-full text-center relative ${cardBg}`}>
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-200">
                    {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-700" />
                        </div>
                    )}
                    <Image
                        fill
                        className={`object-cover transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                        alt={title}
                        src={imageUrl || placeholderImageUrl}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onLoad={() => setIsImageLoading(false)}
                        onError={() => setIsImageLoading(false)}
                    />
                </div>
                {infoLine}
                <div className="flex flex-col pt-2 gap-y-1">
                    <div className={`text-lg md:text-base font-medium group-hover:text-orange-700 transition line-clamp-2 ${titleColor}`}>
                        {title}
                    </div>
                    <p className="text-xs text-muted-foreground min-h-[1rem]">
                        {category || "Brak kategorii"}
                    </p>
                    <p className="text-xs text-blue-400 min-h-[1rem]">
                        {author}
                    </p>
                    <div className="flex flex-col items-center gap-y-2 mt-2">
                        <div className="text-lg font-bold text-orange-700">
                            {typeof price === "number" ? (
                                price === 0 ? (
                                    <span>Darmowy</span>
                                ) : (
                                    <span>
                                        {priceGross?.toFixed(2)}
                                        {currency ? ` ${currency}` : " PLN"}
                                        {isRecurring && interval ? ` / ${interval === 'MONTH' ? 'miesiąc' : interval === 'YEAR' ? 'rok' : interval.toLowerCase()}` : ""}
                                        <span className="block text-xs text-gray-500 font-normal">brutto (VAT {vatRate}%)</span>
                                        {isRecurring && trialPeriodType === 'DAYS' && trialPeriodDays && trialPeriodDays > 0 ? (
                                            <span className="block text-xs text-orange-500 font-normal">{trialPeriodDays} dni za darmo!</span>
                                        ) : null}
                                        {isRecurring && trialPeriodType === 'DATE' && trialPeriodEnd ? (
                                            <span className="block text-xs text-orange-500 font-normal">
                                                Do {new Date(trialPeriodEnd).toLocaleDateString()} za darmo!
                                            </span>
                                        ) : null}
                                    </span>
                                )
                            ) : null}
                        </div>
                    </div>
                    {enrolled && (
                        <div className="mt-2 text-xs text-green-700 font-semibold">
                            Posiadasz dostęp do {type === "educationalPath" ? "ścieżki" : "kursu"}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};
