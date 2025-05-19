"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface SidebarItemProps {
  label: string;
  href: string;
}

export const SidebarItem = ({ label, href }: SidebarItemProps) => {
  const pathName = usePathname();
  const router = useRouter();
  const isActive = (pathName === "/" && href === "/") || pathName.startsWith(href) && href !== "/";

  const onClick = () => {
    router.push(href);
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex items-center gap-x-2 text-orange-600 text-sm font-[500] pl-6 transition-all hover:text-orange-700 hover:bg-orange-100",
        isActive && "text-orange-700 bg-orange-200 hover:bg-orange-200"
      )}
    >
      <div className="flex items-center gap-x-2 py-4 select-none">
        {label}
        <div
          className={cn(
            "ml-auto opacity-0 border-2 border-orange-600 h-full transition-all",
            isActive && "opacity-100"
          )}
        ></div>
      </div>
    </button>
  );
};
