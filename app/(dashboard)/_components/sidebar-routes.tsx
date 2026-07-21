"use client";

import { BarChart, Compass, Layout, List, GroupIcon, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarItem } from "./sidebar-item";
import { useI18n } from "@/hooks/use-i18n";
import { TeacherModeSwitch } from "@/components/teacher-mode-switch";

const getGuestRoutes = (t: (key: string) => string) => [
  {
    icon: Layout,
    label: t("sidebar.yourEducation"),
    href: "/",
  },
  {
    icon: Compass,
    label: t("sidebar.discover"),
    href: "/search",
  },
  {
    icon: BarChart,
    label: t("sidebar.myProgress"),
    href: "/analytics",
  },
  {
    icon: Settings,
    label: t("sidebar.settings"),
    href: "/settings",
  },
];

const getTeacherRoutes = (t: (key: string) => string) => [
  {
    icon: List,
    label: t("sidebar.courses"),
    href: "/teacher/courses",
  },
  {
    icon: Compass,
    label: t("sidebar.educationalPaths"),
    href: "/teacher/educational-paths",
  },
  {
    icon: BarChart,
    label: t("sidebar.statistics"),
    href: "/teacher/analytics",
  },
  {
    icon: GroupIcon,
    label: t("sidebar.students"),
    href: "/teacher/students",
  },
  {
    icon: Layout,
    label: t("sidebar.notifications"),
    href: "/teacher/notifications",
  },
  {
    icon: Settings,
    label: t("sidebar.settings"),
    href: "/teacher/settings",
  },
];

interface OwnedSchool {
  id: number;
  name: string;
}

export const SidebarRoutes = () => {
  const pathName = usePathname();
  const { t } = useI18n();
  const [hasSchool, setHasSchool] = useState(false);

  useEffect(() => {
    const checkUserSchool = async () => {
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
  }, []);

  const guestRoutes = getGuestRoutes(t);
  const teacherRoutes = getTeacherRoutes(t);
  let routes = guestRoutes;

  // Filter teacher routes based on school ownership
  const isTeacherPage = pathName.startsWith("/teacher");
  if (isTeacherPage) {
    routes = teacherRoutes;
    // Remove notifications for teachers who don't own a school
    routes = routes.filter(route => {
      if (route.href === "/teacher/notifications" && !hasSchool) {
        return false; // Hide notifications if not school owner
      }
      return true;
    });
    
    // Add school management before settings if user owns a school
    if (hasSchool) {
      routes = [...routes.slice(0, -1), {
        icon: Users,
        label: t("sidebar.yourSchool"),
        href: "/teacher/school/manage",
      }, routes[routes.length - 1]];
    }
  }

  return (
    <div className="flex w-full flex-col space-y-1">
      <TeacherModeSwitch />
      {routes.map((route) => {
        return (
          <SidebarItem
            key={route.href}
            icon={<route.icon className="h-4 w-4" />}
            label={route.label}
            href={route.href}
          ></SidebarItem>
        );
      })}
    </div>
  );
};
