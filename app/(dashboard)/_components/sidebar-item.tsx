"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface SidebarItemProps {
  label: string;
  href: string;
}

interface SidebarItemProps {
  label: string;
  href: string;
  icon?: ReactNode;
}

export const SidebarItem = ({ label, href, icon }: SidebarItemProps) => {
  const pathName = usePathname();
  const router = useRouter();
  const isActive = (pathName === "/" && href === "/") || pathName.startsWith(href) && href !== "/";
  // icon prop is expected to be a ReactNode, e.g. <BarChart />, <Compass />, etc.
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
      <div className="flex items-center gap-x-2 py-4 select-none w-full">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
        {/* Removed orange dot indicator */}
      </div>
    </button>
  );
};
