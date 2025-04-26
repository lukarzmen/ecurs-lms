"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, PlayCircle, Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ProgressState } from "./course-mobile-sidebar";

interface CourseSidebarItemProps {
    id: number;
    label: string;
    courseId: number; // Added courseId prop
    progressState: ProgressState;
    // isLocked is now determined by progressState
}

export default function CourseSidebarItem({ id, label, courseId, progressState }: CourseSidebarItemProps) {
    const pathName = usePathname();
    const router = useRouter();

    // Determine Icon based on progressState
    const Icon = progressState === "FINISHED" ? CheckCircle : (progressState === "OPEN" ? PlayCircle : Lock);
    const isLocked = progressState === "NOT_STARTED";
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
            // Disable button visually and functionally if locked
            disabled={isLocked}
            className={cn(
                "flex items-center gap-x-2 text-sm font-[500] pl-6 transition-all border border-transparent rounded-md min-h-[50px] w-full text-left", // Ensure text aligns left
                // Base styles per state (not active)
                progressState === "OPEN" && "text-orange-600 hover:text-orange-700 hover:bg-orange-100",
                progressState === "FINISHED" && "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100",
                progressState === "NOT_STARTED" && "text-gray-500 bg-gray-100 cursor-not-allowed", // Locked styles

                // Active styles per state
                isActive && progressState === "OPEN" && "text-orange-700 bg-orange-200 border-orange-300 hover:bg-orange-200 hover:text-orange-700",
                isActive && progressState === "FINISHED" && "text-emerald-700 bg-emerald-200 border-emerald-300 hover:bg-emerald-200 hover:text-emerald-700",
                // No specific active style needed for locked, as it shouldn't be clickable/active
            )}
        >
            <div className="flex items-center gap-x-2 py-4"> {/* Added py-4 for consistent height */}
                <Icon
                    size={22}
                    className={cn(
                        // Base icon color per state
                        progressState === "OPEN" && "text-orange-600",
                        progressState === "FINISHED" && "text-emerald-600",
                        progressState === "NOT_STARTED" && "text-gray-500", // Locked icon color

                        // Active icon color per state
                        isActive && progressState === "OPEN" && "text-orange-700",
                        isActive && progressState === "FINISHED" && "text-emerald-700",
                    )}
                />
                <span>{label}</span>
            </div>
            {/* Optional: Active indicator bar */}
            <div className={
                cn("ml-auto opacity-0 border-2 h-full transition-all", // Removed default bg-sky-700
                    // Active indicator color per state
                    isActive && progressState === "OPEN" && "opacity-100 border-orange-700",
                    isActive && progressState === "FINISHED" && "opacity-100 border-emerald-700",
                    // No active indicator for locked state
                )
            }></div>
        </button>
    );
};
