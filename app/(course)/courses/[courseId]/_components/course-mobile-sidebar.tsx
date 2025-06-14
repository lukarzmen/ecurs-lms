"use client"; // Ensure this is a client component

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Course, Module } from "@prisma/client";
import { Menu } from "lucide-react";
import { CourseSidebar } from "./course-sidebar";
import { useEffect, useState } from "react"; // Import useEffect and useState
import Confetti from 'react-confetti'; // Import a confetti library
import toast from "react-hot-toast";

// Define the possible progress states
export type ProgressState = "LOCKED" | "AVAILABLE" | "OPEN" | "FINISHED";

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
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (course && course.modules && course.modules.length > 0 && course.state === 1) {
            const allModulesFinished = course.modules.every(
                (module) => module.progressState === "FINISHED"
            );
            setShowConfetti(allModulesFinished);
        } else {
            setShowConfetti(false); // Hide confetti if no modules or course data
        }
    }, [course]); // Re-run effect when course data changes

    return (
        <>
            {showConfetti && (
                <Confetti recycle={false}/>
            )}
            <Sheet>
                <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
                    <Menu />
                </SheetTrigger>
                <SheetContent className="p-0 bg-white w-72" side="left">
                    <CourseSidebar course={course} />
                </SheetContent>
            </Sheet>
        </>
    );
}