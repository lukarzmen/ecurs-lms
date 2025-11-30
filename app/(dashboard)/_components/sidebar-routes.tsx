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
  const [ownedSchools, setOwnedSchools] = useState<OwnedSchool[]>([]);

  useEffect(() => {
    const fetchUserSchools = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/user/school");
        if (response.ok) {
          const data = await response.json();
          setOwnedSchools(data.ownedSchools || []);
        }
      } catch (error) {
        console.error("Error fetching user schools:", error);
      }
    };

    fetchUserSchools();
  }, [userId]);

  const isTeacherPage = pathName?.startsWith("/teacher");

  let routes = isTeacherPage ? teacherRoutes : guestRoutes;

  // Dodaj elementy do zarządzania nauczycielami dla każdej szkoły, którą user posiada
  if (isTeacherPage && ownedSchools.length > 0) {
    const schoolManagementRoutes = ownedSchools.map((school) => ({
      icon: Users,
      label: `Zarządzaj: ${school.name}`,
      href: `/teacher/school/${school.id}/manage`,
    }));

    routes = [...routes, ...schoolManagementRoutes];
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
