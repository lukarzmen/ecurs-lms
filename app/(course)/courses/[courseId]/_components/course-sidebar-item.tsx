"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, PlayCircle, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface CourseSidebarItemProps {
    id: number;
    label: string;
    courseId: number;
    isCompleted: boolean;
    isLocked: boolean;
}

export default function CourseSidebarItem({ id, label, courseId, isCompleted, isLocked }: CourseSidebarItemProps) {
    const pathName = usePathname();
    const router = useRouter();
    const Icon = isLocked ? Lock : (isCompleted ? CheckCircle : PlayCircle);
    const isActive = pathName.includes(`chapters/${id}`);

    const onClick = () => {
        router.push(`/courses/${courseId}/chapters/${id}`);
    }

    return (
        <button
            onClick={onClick}
            type="button"
            className={cn(
                "flex items-center gap-x-2 text-orange-600 text-sm font-[500] pl-6 transition-all border border-transparent rounded-md hover:text-orange-700 hover:bg-orange-100",
                isActive && "text-orange-700 bg-orange-200 border-orange-300",
                isCompleted && "text-emerald-600 hover:text-emerald-700",
                isCompleted && isActive && "bg-emerald-200 border-emerald-300",
                "min-h-[50px]"
            )}
        >
            <div className="flex items-center gap-x-2">
                {/* <Icon
                    size={22}
                    className={cn(
                        "text-orange-600",
                        isActive && "text-orange-700",
                        isCompleted && "text-emerald-600"
                    )}
                /> */}
                <span>{label}</span>
            </div>
            <div className={
                cn("ml-auto opacity-0 border-2 bg-sky-700 h-full transition-all",
                    isActive && "opacity-100",
                    isCompleted && "bg-emerald-700",
                )
            }></div>
        </button>
    );
};
