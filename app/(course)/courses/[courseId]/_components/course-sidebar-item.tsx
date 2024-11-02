"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, PlayCircle, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface CourseSidebarItemProps {
    id: string;
    label: string;
    courseId: string;
    isCompleted: boolean;
    isLocked: boolean;
}

export default function CourseSidebarItem({ id, label, courseId, isCompleted, isLocked }: CourseSidebarItemProps)  {
    const pathName = usePathname();
    const router = useRouter();
    const Icon = isLocked ? Lock : (isCompleted ? CheckCircle : PlayCircle);
    const isActive = pathName.includes(id);

    const onClick = () => {
        router.push(`/courses/${courseId}/chapters/${id}`);
    }

    return (
        <button 
        onClick={onClick}
        type="button" 
        
        className={cn(
           "flex items-center gap-x-2 text-slate-500 text-sm font-[500] pl-6 transition-all hover:text-slate-600 hover:bg-slate-300/20",
           isActive && "text-slate-700 bg-slate-200/20 hover:bg-slate-200/20 hover:text-slate-700",
           isCompleted && "text-emerald-700 hover:text-emerald-900",
           isCompleted && isActive && "text-emerald-200/20", 
           "min-h-[50px]"      
        )}>
            <div className="flex items-center gap-x-2">
                <Icon size={22} className={cn(
                    "text-slate-500",
                    isActive && "text-slate-700",
                    isCompleted && "text-emerald-700",
                )}  />
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