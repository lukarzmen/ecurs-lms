import { NavbarRoutes } from "@/components/navbar-routes";
import MobileNavbar from "./mobile-navebar";

const Navbar = () => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      <MobileNavbar />
      <NavbarRoutes />
    </div>
  );
};
export default Navbar;
