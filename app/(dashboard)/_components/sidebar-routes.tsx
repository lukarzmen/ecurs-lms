"use client";

import { BarChart, Compass, Layout, List, GroupIcon, Settings, Users } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

const guestRoutes = [
  {
    icon: Layout,
    label: "Twoja edukacja",
    href: "/",
  },
  {
    icon: Compass,
    label: "Odkrywaj",
    href: "/search",
  },
  {
    icon: BarChart,
    label: "Mój postęp",
    href: "/analytics",
  },
  {
    icon: Settings,
    label: "Ustawienia",
    href: "/settings",
  },
];

const teacherRoutes = [
  {
    icon: List,
    label: "Kursy",
    href: "/teacher/courses",
  },
  {
    icon: Compass,
    label: "Ścieżki edukacyjne",
    href: "/teacher/educational-paths",
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
  {
    icon: Settings,
    label: "Ustawienia",
    href: "/teacher/settings",
  },
];

interface OwnedSchool {
  id: number;
  name: string;
}

export const SidebarRoutes = () => {
  const pathName = usePathname();
  const { userId } = useAuth();
  const [hasSchool, setHasSchool] = useState(false);

  useEffect(() => {
    const checkUserSchool = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/user/school");
        if (response.ok) {
          const data = await response.json();
          setHasSchool((data.ownedSchools || []).length > 0);
        }
      } catch (error) {
        console.error("Error fetching user schools:", error);
      }
    };

    checkUserSchool();
  }, [userId]);

  const isTeacherPage = pathName?.startsWith("/teacher");

  let routes = isTeacherPage ? teacherRoutes : guestRoutes;

  // Filter teacher routes based on school ownership
  if (isTeacherPage) {
    // Remove notifications for teachers who don't own a school
    routes = routes.filter(route => {
      if (route.label === "Powiadomienia" && !hasSchool) {
        return false; // Hide notifications if not school owner
      }
      return true;
    });
    
    // Add "Twoja szkoła" before settings if user owns a school
    if (hasSchool) {
      routes = [...routes.slice(0, -1), {
        icon: Users,
        label: "Twoja szkoła",
        href: "/teacher/school/manage",
      }, routes[routes.length - 1]];
    }
  }

  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => {
        return (
          <SidebarItem
            key={route.href}
            icon={<route.icon />}
            label={route.label}
            href={route.href}
          ></SidebarItem>
        );
      })}
</div>
  );
};
