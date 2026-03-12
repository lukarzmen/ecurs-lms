import { Logo } from "./logo";
import { SidebarRoutes } from "./sidebar-routes";

export const Sidebar = () => {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-border bg-background">
      <div className="flex items-center justify-center border-b border-border px-3 py-5">
        <Logo />
      </div>
      <div className="flex w-full flex-col px-2 py-4">
        <SidebarRoutes />
      </div>
    </div>
  );
};
