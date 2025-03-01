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
}

export const CourseCard = ({
    id,
    title,
    imageId: imageUrl,
    chaptersLength,
    category,
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
            </div>
        </Link>
    );
};