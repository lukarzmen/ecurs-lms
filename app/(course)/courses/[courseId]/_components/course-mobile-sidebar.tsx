"use client"; // Ensure this is a client component

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Course, Module } from "@prisma/client";
import { Menu } from "lucide-react";
import { CourseSidebar } from "./course-sidebar";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Define the possible progress states
export type ProgressState = "LOCKED" | "AVAILABLE" | "OPEN" | "FINISHED";

export interface CourseSidebarProps {
    course: Course & {
        modules: (Module & {
            progressState: ProgressState;
        })[]
    };
}

export const CourseMobileSidebar = ({
    course,
}: CourseSidebarProps) => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (course && course.modules && course.modules.length > 0 && course.state === 1) {
            const allModulesFinished = course.modules.every(
                (module) => module.progressState === "FINISHED"
            );
            setShowPopup(allModulesFinished);
        } else {
            setShowPopup(false);
        }
    }, [course]);

    const handleDownload = () => {
        // Open certificate in new tab (no email param)
        window.open(`/api/courses/${course.id}/certificate`, "_blank");
        setShowPopup(false);
    };

    return (
        <>
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full flex flex-col items-center">
                        <div className="text-xl font-bold mb-3 text-center text-orange-700">
                            🎉 Gratulacje!
                            <span className="block text-base font-medium text-gray-700 mt-1">
                                Ukończyłeś/Ukończyłaś kurs
                            </span>
                            <span className="block font-semibold text-orange-800">
                                {course.title}
                            </span>
                        </div>
                        <button
                            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                            onClick={handleDownload}
                        >
                            Pobierz certyfikat
                        </button>
                        <button
                            className="mt-2 text-sm text-gray-500 hover:underline"
                            onClick={() => setShowPopup(false)}
                        >
                            Zamknij
                        </button>
                    </div>
                </div>
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