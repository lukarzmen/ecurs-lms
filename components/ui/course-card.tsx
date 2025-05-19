"use client";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Loader2 } from "lucide-react"; // Import Loader2
import { IconBadge } from "../icon-badge";
import { useState } from "react"; // Import useState

interface CourseCardProps {
    id: number;
    title: string;
    imageId: string;
    author: string;
    chaptersLength: number;
    category: string;
    moduleId: number | null;
}

export const CourseCard = ({
    id,
    title,
    imageId,
    author,
    chaptersLength,
    category,
    moduleId
}: CourseCardProps) => {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png"; // Replace with your placeholder image path
    const [isImageLoading, setIsImageLoading] = useState(true);

    return (
        <Link href={`/courses/${id}/chapters/${moduleId}`}>
            <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full text-center">
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-200"> {/* Added bg-gray-200 for placeholder background */}
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
                        onError={() => setIsImageLoading(false)} // Also handle error case for loading state
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
                            <IconBadge size="sm" icon={BookOpen}/>
                            <span>{chaptersLength} {chaptersLength === 1 ? "lekcja" : "lekcje"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};