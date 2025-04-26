import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Course, Module,  } from "@prisma/client";
import {Menu} from "lucide-react"
import { CourseSidebar } from "./course-sidebar";

// Define the possible progress states (assuming this type is used)
export type ProgressState = "NOT_STARTED" | "OPEN" | "FINISHED";

export interface CourseSidebarProps {
    course: Course & {
        modules: (Module & {
            progressState: ProgressState; // Add the progressState type here
        })[]
    };
}

export const CourseMobileSidebar = ({
    course,
}: CourseSidebarProps) => {
    return (
        <Sheet>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
                <Menu />
            </SheetTrigger>
            <SheetContent className="p-0 bg-white w-72" side="left">
                <CourseSidebar course={course} />
            </SheetContent>
        </Sheet>
    );
}