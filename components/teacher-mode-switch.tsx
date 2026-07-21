"use client";

import { useAuth } from "@clerk/nextjs";
import { authorizeUser, AuthState } from "@/hooks/use-auth";
import { UserResponse } from "@/app/api/user/route";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, User2 } from "lucide-react";
import { useEffect, useState } from "react";

export const TeacherModeSwitch = () => {
  const pathName = usePathname();
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

  return (
    <Link href={isTeacherPage ? "/" : "/teacher/courses"} className="block w-full">
      <Button variant="ghost" className="w-full justify-start gap-2 select-none">
        {isTeacherPage ? <User2 className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
        {isTeacherPage ? t("nav.studentMode") : t("nav.teacherMode")}
      </Button>
    </Link>
  );
};
