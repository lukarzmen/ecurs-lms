"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface SidebarItemProps {
  label: string;
  href: string;
  icon?: ReactNode;
}

export const SidebarItem = ({ label, href, icon }: SidebarItemProps) => {
  const pathName = usePathname();
  const router = useRouter();

  const isActive = href === "/" ? pathName === "/" : (pathName?.startsWith(href) ?? false);

  const onClick = () => {
    router.push(href);
  };

  return (
    <button
      onClick={onClick}
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors",
        // Orange is the visual motif for navigation accents
        "hover:bg-orange-500/10 hover:text-orange-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive && "bg-orange-500/10 text-orange-700",
        isActive && "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-orange-500"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          "text-muted-foreground group-hover:text-orange-700",
          isActive && "bg-orange-500/15 text-orange-700"
        )}
      >
        {icon}
      </span>
      <span className="select-none truncate">{label}</span>
    </button>
  );
};
