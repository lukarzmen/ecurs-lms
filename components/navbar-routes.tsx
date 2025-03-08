"use client";

import { useAuth, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut, User2 } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "./ui/search-input";

export const NavbarRoutes = () => {
  const pathName = usePathname();

  const isTeacherPage = pathName?.startsWith("/teacher");
  const isCoursesPage = pathName?.startsWith("/courses");
  const isSearchPage = pathName === "/search";
  const user = useUser();

  return (
    <>
      <div className="flex gap-x-2 ml-auto items-center">
        {isTeacherPage || isCoursesPage ? (
          <Link href="/">
            <Button size="sm" variant="ghost">
              <LogOut className="h-4 w-4 mr-2" />
              User mode
            </Button>
          </Link>
        ) : (
          <Link href="/teacher/courses">
            <Button size="sm" variant="ghost">
              <User2 className="h-4 w-4 mr-2" />
              Teacher Mode
            </Button>
          </Link>
        )}
        <div className="flex flex-col items-center mr-5 text-right">
          <UserButton />
          <span className="text-sm pt-2">{user.user?.fullName}</span>
        </div>
      </div>
    </>
  );
};
