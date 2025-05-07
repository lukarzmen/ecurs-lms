"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, PlayCircle, Lock, Circle } from "lucide-react"; // Added Circle for AVAILABLE
import { usePathname, useRouter } from "next/navigation";
import { ProgressState } from "./course-mobile-sidebar";

interface CourseSidebarItemProps {
    id: number;
    label: string;
    courseId: number;
    progressState: ProgressState;
}

export default function CourseSidebarItem({ id, label, courseId, progressState }: CourseSidebarItemProps) {
    const pathName = usePathname();
    const router = useRouter();

    // Determine Icon based on progressState
    const Icon =
        progressState === "FINISHED" ? CheckCircle :
        progressState === "OPEN" ? PlayCircle :
        progressState === "AVAILABLE" ? Circle : // Using Circle for AVAILABLE
        Lock; // Default to Lock for LOCKED

    const isLocked = progressState === "LOCKED";
    const isActive = pathName.includes(`chapters/${id}`);

    const onClick = () => {
        // Prevent navigation if the chapter is locked
        if (isLocked) {
            return;
        }
        router.push(`/courses/${courseId}/chapters/${id}`);
    }

    return (
        <button
            onClick={onClick}
            type="button"
            disabled={isLocked}
            className={cn(
                "flex items-center gap-x-2 text-sm font-[500] pl-6 transition-all border border-transparent rounded-md min-h-[50px] w-full text-left",
                // Base styles per state (not active)
                progressState === "LOCKED" && "text-gray-500 bg-gray-100 cursor-not-allowed",
                progressState === "AVAILABLE" && "text-slate-700 hover:text-slate-800 hover:bg-slate-100", // Styles for AVAILABLE
                progressState === "OPEN" && "text-orange-600 hover:text-orange-700 hover:bg-orange-100",
                progressState === "FINISHED" && "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100",

                // Active styles per state
                isActive && progressState === "LOCKED" && "", // Locked items shouldn't appear active
                isActive && progressState === "AVAILABLE" && "text-slate-800 bg-slate-200 border-slate-300 hover:bg-slate-200 hover:text-slate-800",
                isActive && progressState === "OPEN" && "text-orange-700 bg-orange-200 border-orange-300 hover:bg-orange-200 hover:text-orange-700",
                isActive && progressState === "FINISHED" && "text-emerald-700 bg-emerald-200 border-emerald-300 hover:bg-emerald-200 hover:text-emerald-700",
            )}
        >
            <div className="flex items-center gap-x-2 py-4">
                <Icon
                    size={22}
                    className={cn(
                        "flex-shrink-0",
                        // Base icon color per state
                        progressState === "LOCKED" && "text-gray-500",
                        progressState === "AVAILABLE" && "text-slate-700", // Icon color for AVAILABLE
                        progressState === "OPEN" && "text-orange-600",
                        progressState === "FINISHED" && "text-emerald-600",

                        // Active icon color per state
                        isActive && progressState === "LOCKED" && "", // Locked items shouldn't appear active
                        isActive && progressState === "AVAILABLE" && "text-slate-800",
                        isActive && progressState === "OPEN" && "text-orange-700",
                        isActive && progressState === "FINISHED" && "text-emerald-700",
                    )}
                />
                <span>{label}</span>
            </div>
            <div className={
                cn("ml-auto opacity-0 border-2 h-full transition-all",
                    // Active indicator color per state
                    isActive && progressState === "LOCKED" && "", // No indicator for locked
                    isActive && progressState === "AVAILABLE" && "opacity-100 border-slate-700", // Indicator for AVAILABLE
                    isActive && progressState === "OPEN" && "opacity-100 border-orange-700",
                    isActive && progressState === "FINISHED" && "opacity-100 border-emerald-700",
                )
            }></div>
        </button>
    );
};
