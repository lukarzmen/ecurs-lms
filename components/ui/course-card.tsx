import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { IconBadge } from "../icon-badge";
import { formatPrice } from "@/lib/format";

interface CourseCardProps {
    id: number;
    title: string;
    imageId: string;
    chaptersLength: number;
    category: string;
    moduleId: number;
}

export const CourseCard = ({
    id,
    title,
    imageId,
    chaptersLength,
    category,
    moduleId
}: CourseCardProps) => {
    const imageUrl = imageId ? `/api/image/${imageId}` : null;
    const placeholderImageUrl = "/logo.png"; // Replace with your placeholder image path

    return (
        <Link href={`/courses/${id}/chapters/${moduleId}`}>
            <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full">
                <div className="relative w-full aspect-square rounded-md overflow-hidden">
                    <Image fill className="object-cover" alt={title} src={imageUrl || placeholderImageUrl}></Image>
                </div>
                <div className="flex flex-col pt-2">
                    <div className="text-lg md:text-base font-medium group-hover:text-orange-700 transition line-clamp-2">
                        {title}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {category}
                    </p>
                    <div className="my-3 flex items-center gap-x-2 text-sm">
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