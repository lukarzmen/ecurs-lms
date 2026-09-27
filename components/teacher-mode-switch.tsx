"use client";

import { useAuth } from "@clerk/nextjs";
import { authorizeUser, AuthState } from "@/hooks/use-auth";
import { UserResponse } from "@/app/api/user/route";
import { useI18n } from "@/hooks/use-i18n";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Presentation } from "lucide-react";

interface TeacherModeSwitchProps {
  compact?: boolean;
}

export const TeacherModeSwitch = ({ compact = false }: TeacherModeSwitchProps) => {
  const pathName = usePathname();
  const router = useRouter();
  const isTeacherPage = pathName?.startsWith("/teacher");
  const { userId, sessionId } = useAuth();
  const { t } = useI18n();
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null);
  const [authState, setAuthState] = useState<AuthState>("notAuthorized");

  useEffect(() => {
    if (!userId) {
      return;
    }

    const authorize = async () => {
      try {
        const result = await authorizeUser(userId, sessionId ?? null);
        setUserResponse(result.userResponse ?? null);
        setAuthState(result.authState);
      } catch (error) {
        console.error("Authorization error:", error);
        setAuthState("notAuthorized");
      }
    };

    authorize();
  }, [userId, sessionId]);

  if (!userId || authState === "notAuthorized" || authState === "userNotExists") {
    return null;
  }

  if (userResponse?.roleId !== 1) {
    return null;
  }

  const value: "student" | "teacher" = isTeacherPage ? "teacher" : "student";

  const handleValueChange = (next: "student" | "teacher") => {
    if (next === value) {
      return;
    }
    router.push(next === "teacher" ? "/teacher/courses" : "/");
  };

  const options = [
    {
      key: "student" as const,
      label: t("nav.studentModeShort"),
      title: t("nav.studentMode"),
      icon: GraduationCap,
    },
    {
      key: "teacher" as const,
      label: t("nav.teacherModeShort"),
      title: t("nav.teacherMode"),
      icon: Presentation,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("nav.teacherMode")}
      className="relative inline-grid shrink-0 select-none grid-cols-2 items-center gap-0.5 rounded-full bg-muted p-1"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-background shadow-sm transition-transform duration-200 ease-out",
          value === "teacher" && "translate-x-[calc(100%+4px)]",
        )}
      />
      {options.map(({ key, label, title, icon: Icon }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => handleValueChange(key)}
          title={title}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            value === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          <span className={cn(compact && "hidden lg:inline")}>{label}</span>
        </button>
      ))}
    </div>
  );
};
