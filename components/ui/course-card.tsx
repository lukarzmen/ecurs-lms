import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { IconBadge } from "../icon-badge";
import { formatPrice } from "@/lib/format";

interface CourseCardProps {
    id: string;
    title: string;
    imageUrl: string;
    chaptersLength: number;
    price: number;
    category: string;
    progress: number | null;
}

export const CourseCard = ({
    id,
    title,
    imageUrl,
    chaptersLength,
    price,
    category,
    progress,
}: CourseCardProps) => {
    return (
        <Link href={`/courses/${id}`}>
            <div className="group hover:shadow-sm transition overflow-hidden border rounded0lg p-3 h-full">
                <div className="relative w-full aspect-video rounded-md overflow-hidden">
                    <Image fill className="object-cover" alt={title} src={imageUrl || ''}></Image>
                </div>
            </div>
            <div className="flex flex-col pt-2">
                <div className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
                    {title}
                </div>
                <p className="text-xs text-muted-foreground">
                    {category}
                </p>
                <div className="my-3 flex items-center gap-x-2 text-sm">
                    <div className="flex items-center gap-x-2 text-slate-500">
                        <IconBadge size="sm" icon={BookOpen}/>
                        <span>{chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}</span>
                    </div>
                </div>
                {progress !== null ? (
                    <div>
                        {/* todo: progress bar */}
                    </div>
                ) : (
                    <p className="text-md md:text-sm font-medium text-slate-700">
                        {formatPrice(price)}
                    </p>
                )}
            </div>
        </Link>
    );
};