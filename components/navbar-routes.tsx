"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { authorizeUser, AuthState } from "@/hooks/use-auth";
import { UserResponse } from "@/app/api/user/route";
import { useEffect, useState } from "react";

export const NavbarRoutes = () => {
  const pathName = usePathname();

  const clerkAuth = useAuth();
  const { userId, sessionId } = clerkAuth;
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

  return (
    <>
      <div className="flex gap-x-2 ml-auto items-center">
        <div className="flex flex-col items-center mr-5 text-right ">
          <UserButton  />
          {userResponse && (
            <span className="text-sm pt-2">{`${userResponse.firstName} ${userResponse.lastName}`}</span>
          )}
        </div>
      </div>
    </>
  );
};
