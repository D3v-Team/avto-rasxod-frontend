import {

  Flex,
  Text,
  Icon,
  VStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Tooltip,
  useColorMode,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LucideLogOut,
  SunMoon,
  UserCog2,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/useUIStore";
// import { useTranslation } from "react-i18next";
import LogoutModal from "./LogoutModal";

export default function Sidebar({ collapsed, links = [], role, end = false }) {
  const { toggleColorMode } = useColorMode();
  const setCollapsed = useUIStore((s) => s.toggleSidebar);
  const { logout } = useAuth();
  const { user } = useAuthStore();
  return (
    <Flex
      position="fixed"
      w={collapsed ? "70px" : "220px"}
      minH="100vh"
      bg="surface"
      color="text"
      direction="column"
      justify="space-between"
      p={3}
      transition="0.25s ease"
      boxShadow="lg"
      left={0}
      top={0}
      zIndex={1000}
    >
      {/* COLLAPSE TOGGLE BUTTON */}
      <Button
        position="absolute"
        right="0px"
        top="15px"
        size="sm"
        borderRadius="full"
        borderRightRadius={0}
        onClick={() => setCollapsed()}
        bg="surface"
        _hover={{ bg: "gray.500", color: "surface" }}
        color={"text"}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {/* TOP LINKS */}
      <VStack align="stretch" spacing={1} mt={14}>
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={{ textDecoration: "none" }}
            end={item.end}
          >
            {({ isActive }) => (
              <Tooltip label={collapsed ? item.label : ""} placement="right">
                <Flex
                  align="center"
                  gap={2}
                  p={3}
                  borderRadius="lg"
                  bg={isActive ? "secondary" : "transparent"}
                  _hover={{ bg: "secondary", color: "white" }}
                  cursor="pointer"
                  transition="0.2s"
                  color={isActive ? "white" : "text"}
                >
                  <Icon as={item.icon} w={5} h={5} />
                  {!collapsed && <Text fontWeight="medium">{item.label}</Text>}
                </Flex>
              </Tooltip>
            )}
          </NavLink>
        ))}
      </VStack>
      <VStack align="stretch">
      
         
         


          <Flex
            align="center"
            gap={collapsed ? 0 : 2}
            p={2}
            borderRadius="md"
            _hover={{ bg: "secondary", color: "white" }}
            onClick={() => toggleColorMode()}
            cursor="pointer"
          >
            <SunMoon size={20} />
            {!collapsed && <Text>Theme</Text>}
          </Flex>
       

        <Menu placement="right">
          <Tooltip
            label={collapsed ? user?.full_name : ""}
            placement="right"
            openDelay={200}
          >
            <Flex alignItems={"center"}>
              <MenuButton
               
                w="100%"
                cursor={collapsed ? "pointer" : "default"}
              >
                <Flex
                  align="center"
                  gap={3}p={0}
                  borderRadius="lg"
                  _hover={{ bg: "gray.700" }}
                  transition="0.2s"
                >
                 

                  {!collapsed && (
                    <Flex
                      width="100%"
                      alignItems="center"
                      justifyContent="space-between"
                      p={2}
                      borderRadius="xl"
                      transition="all 0.2s ease"
                      _hover={{ bg: "whiteAlpha.50" }}
                    >
                      <HStack spacing={3} overflow="hidden">
                       
                        <Avatar
                          size="sm"
                          name={user?.full_name}
                          bg="blue.500"
                          color="white"
                          fontWeight="bold"
                        />

           
                        <VStack align="start" spacing={0.5} overflow="hidden">
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            lineHeight="1.2"
                            color="text"
                            isTruncated
                            maxW="140px"
                          >
                            {user?.full_name || "Xodim ismi"}
                          </Text>

   
                          <Badge
                            colorScheme={
                              user?.role === "driver" ? "green" : "blue"
                            }
                            variant="subtle"
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            textTransform="capitalize"
                          >
                            {user?.role || "Xodim"}
                          </Badge>
                        </VStack>
                      </HStack>
                    </Flex>
                  )}
                </Flex>
              </MenuButton>
              {!collapsed ? <LogoutModal /> : <noscript></noscript>}
            </Flex>
          </Tooltip>

          {/* HOVER MENU */}
          {collapsed ? (
            <MenuList bg="surface" borderColor="border">
              <MenuItem
                icon={<LucideLogOut />}
                bg="surface"
                _hover={{ bg: "red.300", color: "red" }}
                onClick={logout}
              >
                Logout
              </MenuItem>
            </MenuList>
          ) : (
            <noscript></noscript>
          )}
        </Menu>
      </VStack>
    </Flex>
  );
}
