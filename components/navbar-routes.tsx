"use client";

import { useAuth, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut, User2 } from "lucide-react";
import Link from "next/link";
import { authorizeUser, AuthState } from "@/hooks/use-auth";
import { UserResponse } from "@/app/api/user/route";
import { auth } from "@clerk/nextjs/server";
import { useEffect, useState } from "react";
import { set } from "zod";

export const NavbarRoutes = () => {
  const pathName = usePathname();

  const isTeacherPage = pathName?.startsWith("/teacher");
  const isCoursesPage = pathName?.startsWith("/courses");
  const user = useUser();
  const clerkAuth = useAuth();
  const { userId, sessionId} = clerkAuth;
  const [userResponse, setUserResponse] = useState<UserResponse | null>(null);
  const [authState, setAuthState] = useState<AuthState>("notAuthorized");
  
  useEffect(() => {
    if (!userId) {
      return;
    }
    const authorize = async () => {
      try {
        const result = await authorizeUser(userId, sessionId);
        setUserResponse(result.userResponse ?? null);
        setAuthState(result.authState);
      } catch (error) {
        console.error("Authorization error:", error);
        setAuthState("notAuthorized");
      }
    };
  
    authorize(); // Only called once when userId or sessionId changes.
  }, [userId, sessionId]); // Dependency array ensures re-execution when these values change.

  if (!userId || authState === 'notAuthorized' || authState === 'userNotExists') {
    return null; // or a loading indicator
  }

  const isTeacher = userResponse?.roleId === 1;
  return (
    <>
      <div className="flex gap-x-2 ml-auto items-center">
        {isTeacher && (isTeacherPage || isCoursesPage) ? (
          <Link href="/">
            <Button size="sm" variant="ghost">
              <LogOut className="h-4 w-4 mr-2" />
              Uczeń
            </Button>
          </Link>
        ) : isTeacher ? (
          <Link href="/teacher/courses">
            <Button size="sm" variant="ghost">
              <User2 className="h-4 w-4 mr-2" />
              Nauczyciel
            </Button>
          </Link>
        ) : null}
        <div className="flex flex-col items-center mr-5 text-right">
          <UserButton />
          {userResponse && (
            <span className="text-sm pt-2">{`${userResponse.firstName} ${userResponse.lastName}`}</span>
          )}
        </div>
      </div>
    </>
  );
};
