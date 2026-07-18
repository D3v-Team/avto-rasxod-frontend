import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import {  LocationEdit, Users } from "lucide-react";

const links = [
    { label: "Admins", to: "/superadmin/admins", icon: Users },
    { label: "Locations", to: "/superadmin/locations", icon: LocationEdit },
]

export default function SuperAdminLayout() {
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
    )
}