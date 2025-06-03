"use client";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react";
import { IconBadge } from "../icon-badge";
import { useState } from "react";

interface CourseCardProps {
    id: number;
    title: string;
    imageId: string;
    author: string;
    chaptersLength: number;
    category: string;
    nonFinishedModuleId: number | null;
    price?: number | null;
    showPrice?: boolean;
    enrolled?: boolean;
}

export const CourseCard = ({
    id,
    title,
    imageId,
    author,
    chaptersLength,
    category,
    nonFinishedModuleId,
    price,
    showPrice = false,
    enrolled = false,
}: CourseCardProps) => {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png";
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Determine link target
    const linkHref = showPrice
        ? `/courses/${id}/enroll`
        : `/courses/${id}/chapters/${nonFinishedModuleId}`;

    const cardContent = (
        <div
            className={`group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full text-center
                ${enrolled ? "bg-gray-100 opacity-60 pointer-events-none select-none" : ""}
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
                {showPrice && (
                    <div className="mt-1 text-sm font-semibold">
                        {typeof price === "number"
                            ? price === 0
                                ? <span className="text-orange-700">Darmowy</span>
                                : <span className="text-orange-700">{price} PLN</span>
                            : null}
                    </div>
                )}
                {enrolled && (
                    <div className="mt-2 text-xs text-green-700 font-semibold">
                        Posiadasz dostęp do kursu
                    </div>
                )}
            </div>
        </div>
    );

    // If enrolled, render as a disabled card (no link)
    if (enrolled) {
        return cardContent;
    }

    // Otherwise, render as a link
    return (
        <Link href={linkHref}>
            {cardContent}
        </Link>
    );
};