"use client";

import { useAuth, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "./ui/search-input";

export const NavbarRoutes = () => {
  const pathName = usePathname();

  const isTeacherPage = pathName?.startsWith("/teacher");
  const isCoursesPage = pathName?.startsWith("/courses");
  const isSearchPage = pathName === "/search";
  const user = useUser();

  return (
    <>{isSearchPage && (
      <div className="hidden md:block">
        <SearchInput></SearchInput>
      </div>
    )}
      <div className="flex gap-x-2 ml-auto">
        {isTeacherPage || isCoursesPage ? (
          <Link href="/">
            <Button size="sm" variant="ghost">
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </Link>
        ) : (
          <Link href="/teacher/courses">
            <Button size="sm" variant="ghost">
              Teacher Mode
            </Button>
          </Link>
        )}
        <div className="flex flex-col items-center">
          <UserButton />
          <span className="text-sm">{user.user?.fullName}</span>
          {/* <span className="text-sm">{user.user?.primaryEmailAddress?.emailAddress}</span> */}
        </div>
      </div>
    </>
  );
};
