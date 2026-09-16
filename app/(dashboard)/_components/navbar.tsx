import { NavbarRoutes } from "@/components/navbar-routes";
import { TeacherModeSwitch } from "@/components/teacher-mode-switch";
import MobileNavbar from "./mobile-navebar";

const Navbar = () => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      <MobileNavbar />
      <div className="ml-auto flex items-center gap-3">
        <TeacherModeSwitch />
        <NavbarRoutes />
      </div>
    </div>
  );
};
export default Navbar;
