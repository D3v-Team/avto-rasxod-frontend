import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Car, Fuel, HomeIcon, Users, Wallet2 } from "lucide-react";

const links = [
  { label: "Bosh sahifa", to: "/xodim/dashboard", icon: HomeIcon },
  { label: "Xarajatlar", to: "/xodim/costs", icon: Wallet2 },
  { label: "Avtomobillar", to: "/xodim/cars", icon: Car },
   { label: "Xodimlar", to: "/xodim/admins", icon: Users },
  { label: "Yoqilg'i", to: "/xodim/fuel", icon: Fuel },
];

export default function XodimLayout() {
  const { collapsed } = useUIStore();
  return (
    <Box>
      <Sidebar collapsed={collapsed} links={links} role={"admin"} />
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