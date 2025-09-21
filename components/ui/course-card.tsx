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
    chaptersLength: number;
    category: string;
    nonFinishedModuleId: number | null;
}

interface MarketplaceCourseCardProps extends BaseCourseCardProps {
    price?: number | null;
    currency?: string | null;
    isRecurring?: boolean;
    interval?: string | null;
    trialPeriodDays?: number | null;
}

export interface CourseInfoCardProps extends BaseCourseCardProps {
    enrolled?: boolean;
    isCompleted?: boolean;
}

export function MarketplaceCourseCard({
    id,
    title,
    imageId,
    author,
    chaptersLength,
    category,
    price,
    currency,
    isRecurring,
    interval,
    trialPeriodDays,
}: MarketplaceCourseCardProps) {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png";
    const [isImageLoading, setIsImageLoading] = useState(true);
    const linkHref = `/courses/${id}/enroll`;
    return (
        <Link href={linkHref}>
            <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full text-center">
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
                <div className="flex flex-col pt-2 gap-y-1">
                    <div className="text-lg md:text-base font-medium group-hover:text-orange-700 transition line-clamp-2">
                        {title}
                    </div>
                    <p className="text-xs text-muted-foreground min-h-[1rem]">
                        {category || "Brak kategorii"}
                    </p>
                    <p className="text-xs text-blue-400 min-h-[1rem]">
                        {author}
                    </p>
                    <div className="flex flex-col items-center gap-y-2 mt-2">
                        {/* <div className="flex items-center gap-x-2 text-orange-500">
                            <IconBadge size="sm" icon={BookOpen} />
                            <span>{chaptersLength} {chaptersLength === 1 ? "lekcja" : "lekcje"}</span>
                        </div> */}
                        <div className="text-lg font-bold text-orange-700">
                            {typeof price === "number" ? (
                                price === 0 ? (
                                    <span>Darmowy</span>
                                ) : (
                                    <span>
                                        {price}
                                        {currency ? ` ${currency}` : " PLN"}
                                        {isRecurring && interval ? ` / ${interval === 'MONTH' ? 'miesiąc' : interval === 'YEAR' ? 'rok' : interval.toLowerCase()}` : ""}
                                        {isRecurring && trialPeriodDays && trialPeriodDays > 0 ? (
                                            <span className="block text-xs text-orange-500 font-normal">{trialPeriodDays} dni za darmo!</span>
                                        ) : null}
                                    </span>
                                )
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const CourseInfoCard = ({
    id,
    title,
    imageId,
    author,
    chaptersLength,
    category,
    nonFinishedModuleId,
    enrolled = false,
    isCompleted = false,
}: CourseInfoCardProps) => {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png";
    const [isImageLoading, setIsImageLoading] = useState(true);
    const linkHref = `/courses/${id}/chapters/${nonFinishedModuleId}`;
    return (
        <Link href={linkHref}>
            <div
                className={`group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full text-center
                    ${enrolled ? "bg-gray-100 opacity-60 pointer-events-none select-none" : ""}
                    ${isCompleted ? "border-2 border-orange-500 bg-orange-50" : ""}
                `}
            >
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
                <div className="flex flex-col pt-2">
                    <div className="text-lg md:text-base font-medium group-hover:text-orange-700 transition line-clamp-2">
                        {title}
                    </div>
                    <p className="text-xs pt-1 text-muted-foreground min-h-[1rem]">
                        {category || "Brak kategorii"}
                    </p>
                    <p className="text-xs pt-1 text-blue-400 min-h-[1rem]">
                        {author}
                    </p>
                    <div className="my-3 flex items-center justify-center gap-x-2 text-sm">
                        <div className="flex items-center gap-x-2 text-orange-500">
                            <IconBadge size="sm" icon={BookOpen} />
                            <span>{chaptersLength} {chaptersLength === 1 ? "lekcja" : "lekcje"}</span>
                        </div>
                    </div>
                    {enrolled && (
                        <div className="mt-2 text-xs text-green-700 font-semibold">
                            Posiadasz dostęp do kursu
                        </div>
                    )}
                    {isCompleted && (
                        <div className="mt-2 text-xs text-orange-700 font-semibold">
                            Ukończony
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};