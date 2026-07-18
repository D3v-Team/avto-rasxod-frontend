import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Car, Fuel, HomeIcon, Users, Wallet2 } from "lucide-react";

const links = [
  { label: "Bosh sahifa", to: "/admin/dashboard", icon: HomeIcon },
  { label: "Xarajatlar", to: "/admin/costs", icon: Wallet2 },
  { label: "Avtomobillar", to: "/admin/cars", icon: Car },
  { label: "Xodimlar", to: "/admin/admins", icon: Users },
  { label: "Yoqilg'i", to: "/admin/fuel", icon: Fuel },
];

export default function AdminLayout() {
  const { collapsed } = useUIStore();
  return (
    <Box>
      <Sidebar collapsed={collapsed} links={links} role={"SUPER_ADMIN"} />
      <Box
        pl={collapsed ? "80px" : "250px"}
        transition="0.25s ease"
        minH="100vh"
      >
        <Outlet />
      </Box>
    </Box>
  );
}