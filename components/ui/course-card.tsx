"use client";
import Link from "next/link";
import Image from "next/image";
import { IconBadge } from "../icon-badge";
import { BookOpen, Loader2 } from "lucide-react";
import { CourseInfoCardProps } from "./marketplace-course-card";
import { useState } from "react";

export const CourseInfoCard = ({
    id,
    title,
    imageId,
    author,
    category,
    schoolId,
    schoolName,
    type,
    isCompleted = false,
    modulesCount,
}: CourseInfoCardProps & { modulesCount?: number }) => {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png";
    const [isImageLoading, setIsImageLoading] = useState(true);
    const linkHref = type === "educationalPath" ? `/educational-paths/${id}` : `/courses/${id}`;
    
    // Wyświetl nazwę szkoły jeśli kurs należy do szkoły, inaczej wyświetl autora
    const displayAuthor = schoolId && schoolName ? schoolName : author;
    return (
        <Link href={linkHref}>
            <div
                className={`group hover:shadow-lg transition overflow-hidden border rounded-lg p-3 h-full text-center relative ${isCompleted ? "border-2 border-orange-500 bg-orange-50" : "bg-white border-gray-300"}`}
            >
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-200">
                    {/* Info line for course or educational path */}
                    {type === "educationalPath" ? (
                        <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded shadow">Ścieżka edukacyjna</div>
                    ) : (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Kurs</div>
                    )}
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
                    <div className="text-lg md:text-base font-medium group-hover:text-orange-700 transition line-clamp-2 text-blue-700">
                        {title}
                    </div>
                    <p className="text-xs text-muted-foreground min-h-[1rem]">
                        {category || "Brak kategorii"}
                    </p>
                    <p className="text-xs text-blue-400 min-h-[1rem]">
                        {displayAuthor}
                    </p>
                    <div className="my-3 flex items-center justify-center gap-x-2 text-sm">
                        {type === "educationalPath" ? (
                            <div className="flex items-center gap-x-2 text-orange-500">
                                <IconBadge size="sm" icon={BookOpen} />
                                <span>{modulesCount ?? 0} {modulesCount === 1 ? "kurs" : "kursy"}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-x-2 text-orange-500">
                                <IconBadge size="sm" icon={BookOpen} />
                                <span>{modulesCount} {modulesCount === 1 ? "lekcja" : "lekcje"}</span>
                            </div>
                        )}
                    </div>
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
export default CourseInfoCard;