"use client";

import { BarChart, Compass, Layout, List, GroupIcon } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { usePathname } from "next/navigation";

const guestRoutes = [
  {
    icon: Layout,
    label: "Twoje kursy",
    href: "/",
  },
  {
    icon: Compass,
    label: "Odkrywaj",
    href: "/search",
  },
];

const teacherRoutes = [
  {
    icon: List,
    label: "Kursy",
    href: "/teacher/courses",
  },
  {
    icon: BarChart,
    label: "Statystyki",
    href: "/teacher/analytics",
  },
  {
    icon: GroupIcon,
    label: "Kursanci",
    href: "/teacher/students",
  },
    {
      icon: Layout,
      label: "Powiadomienia",
      href: "/teacher/notifications",
    },
];
export const SidebarRoutes = () => {
  const pathName = usePathname();

  const isTeacherPage = pathName?.startsWith("/teacher");

  const routes = isTeacherPage ? teacherRoutes : guestRoutes;
  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => {
        return (
          <SidebarItem
            key={route.href}
            // icon={route.icon}
            label={route.label}
            href={route.href}
          ></SidebarItem>
        );
      })}
    </div>
  );
};
