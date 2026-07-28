import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Car, Fuel, HomeIcon, User, Users, Wallet2, Wrench } from "lucide-react";

const links = [
  { label: "Bosh sahifa", to: "/superadmin/dashboard", icon: HomeIcon },
  { label: "Yoqilg'i xarajatlari", to: "/superadmin/costs", icon: Wallet2 },
  { label: "Avtomobillar", to: "/superadmin/cars", icon: Car },
  { label: "Ehtiyot xarajatlari", to: "/superadmin/zapchast", icon: Wrench },
  { label: "Xodimlar", to: "/superadmin/admins", icon: Users },
  { label: "Yoqilg'i", to: "/superadmin/fuel", icon: Fuel },
  { label: "Adminlar", to: "/superadmin/admin", icon: User },
];

export default function AdminLayout() {
  const { collapsed } = useUIStore();
  return (
    <Box>
      <Sidebar collapsed={collapsed} links={links} role={"SUPER_ADMIN"} />
      <Box
        pl={collapsed ? "80px" : "220px"}
        transition="0.25s ease"
        minH="100vh"
      >
        <Outlet />
      </Box>
    </Box>
  );
}