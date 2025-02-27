"use client";

import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "./ui/search-input";
import SignInButton from "@/app/(auth)/(routes)/sign-in/[[...sign-in]]/__component/SignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";

export const NavbarRoutes = () => {
  const pathName = usePathname();
  const auth = useAuth();
  const user = auth?.currentUser;
  const isTeacherPage = pathName?.startsWith("/teacher");
  const isCoursesPage = pathName?.startsWith("/courses");
  const isSearchPage = pathName === "/search";


  return (
    <>{isSearchPage && (
      <div className="hidden md:block">
        <SearchInput></SearchInput>
      </div>
    )}
      <div className="flex gap-x-4 ml-auto">
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
        {
          user ? (
            <div className="flex items-center pr-4" onClick={() => {
        
        
              
            }}>
              <img src={user.photoURL ?? ""} alt="User Avatar" className="w-6 h-6 rounded-full mr-1" referrerPolicy="no-referrer" />
              <div className="flex flex-col">
              <h2 className="text-xs font-medium">{user.displayName}</h2>
              <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          ) : (
            <SignInButton />
          )
        }
      </div>
    </>
  );
};
