"use client"; // Mark as a Client Component

import CourseSidebarItem from "./course-sidebar-item";
import { CourseSidebarProps } from "./course-mobile-sidebar";
import { StudentCommunicationLinks } from "./student-communication-links";
import { useI18n } from "@/hooks/use-i18n";
import { TeacherModeSwitch } from "@/components/teacher-mode-switch";

export const CourseSidebar = ({ course }: CourseSidebarProps) => {
    const { t } = useI18n();
    const totalModules = course.modules?.length ?? 0;
    const completedModules = course.modules?.filter(m => m.progressState === "FINISHED").length ?? 0;
    const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm rounded-md">
            <div className="border-b px-4 py-3">
                <TeacherModeSwitch />
            </div>
            <div className="p-7 flex flex-col border-b gap-y-3">
                <h1 className="font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {course.title}
                </h1>
                {totalModules > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t("courseSidebar.progress")}</span>
                            <span className="font-medium text-emerald-600">{completedModules}/{totalModules}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col w-full">
                {course.modules && course.modules.map(
                    (chapter) => (
                        <CourseSidebarItem
                            key={chapter.id}
                            id={chapter.id}
                            label={chapter.title}
                            courseId={course.id}
                            progressState={chapter.progressState}
                        />
                    )
                )}
            </div>
        </div>
    );
};