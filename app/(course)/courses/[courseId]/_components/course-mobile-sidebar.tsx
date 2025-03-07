import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Course, Module,  } from "@prisma/client";
import {Menu} from "lucide-react"
import { CourseSidebar } from "./course-sidebar";

interface CourseMobileSidebarProps {
    course: Course & {
        modules: (Module & {
        })[]
    };
    progressCount: number | null;
}

export const CourseMobileSidebar = ({
    course,
    progressCount,
}: CourseMobileSidebarProps) => {
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