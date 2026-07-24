import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Image,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Auth } from "../../Services/api/Auth";
import { useAuth } from "../../hooks/useAuth";
import { toastService } from "../../utils/toast";
import { useNavigate } from "react-router";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const passInput = useRef("");
  const logInput = useRef("");

  const [errors, setErrors] = useState({ login: "", password: "" });

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginText = logInput.current.value.trim();
    const password = passInput.current.value.trim();

    let newErrors = {};

    if (!loginText) {
      newErrors.login = "Login kiritilmadi";
    }
    if (!password) {
      newErrors.password = "Parol kiritilmadi";
    } else if (password.length < 6) {
      newErrors.password = "Parol kamida 6 belgidan iborat bo'lishi kerak";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      username: logInput.current.value,
      password: passInput.current.value,
    };

    setLoading(true);

    try {
      const res = await Auth.Login(payload);

      // Agar status 200 yoki 201 bo'lmasa, xato xabarini ko'rsat va chiq
      if (res.status !== 200 && res.status !== 201) {
        toastService.error(res?.data?.message || "Login xatosi");
        return;
      }

      const data = res.data;

      if (!data.user) {
        toastService.error("Login ma'lumotlari topilmadi");
        return;
      }

      // Rolni tekshirish
      if (data.user.role !== "super_admin" && data.user.role !== "admin") {
        toastService.error("Sizda tizimga kirish huquqi yo'q.");
        return;
      }

      login({
        token: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
        user: data.user,
      });

      toastService.success("Xush kelibsiz!");

      if (data.user.role === "super_admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/xodim/dashboard", { replace: true });
      }
    } catch (error) {
      // Tarmoq yoki server xatosi
      toastService.error(
        error?.response?.data?.message || "Tizimda xatolik yuz berdi",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" w="100vw" overflow="hidden" bg="bg">
      {/* Chap taraf – banner */}
      <Box
        display={{ base: "none", md: "block" }}
        w={{ md: "50%", lg: "55%", xl: "60%" }}
        h="100vh"
        position="relative"
      >
        <Image
          src="/public/img/login.png"
          alt="Login Banner"
          w="100%"
          h="100%"
          objectFit="cover"
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(to-t, blackAlpha.800, transparent)"
          display="flex"
          alignItems="flex-end"
          p={12}
        >
          <Box color="white">
            <Heading size="xl" mb={3} fontWeight="bold">
              Avto Rasxod Tizimi
            </Heading>
            <Text fontSize="lg" opacity={0.85}>
              Barcha xarajatlar va hisobotlarni qulay boshqaring
            </Text>
          </Box>
        </Box>
      </Box>

      {/* O‘ng taraf – forma */}
      <Flex
        w={{ base: "100%", md: "50%", lg: "45%", xl: "40%" }}
        h="100vh"
        align="center"
        justify="center"
        p={{ base: 6, sm: 10, md: 12 }}
        bg="surface"
      >
        <Box as="form" onSubmit={handleSubmit} w="100%" maxW="400px">
          <Box mb={8}>
            <Heading
              size="lg"
              mb={2}
              color="text"
              fontWeight="700"
              letterSpacing="-0.5px"
            >
              Tizimga kirish
            </Heading>
            <Text color="textSecondary" fontSize="sm" opacity={0.8}>
              Davom etish uchun hisobingizga kiring
            </Text>
          </Box>

          {/* Login */}
          <FormControl mb={5} isInvalid={!!errors.login}>
            <FormLabel
              color="text"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Login
            </FormLabel>
            <Input
              ref={logInput}
              placeholder="Loginni kiriting"
              onChange={() => clearError("login")}
              size="lg"
              borderRadius="xl"
              bg="bg"
              borderColor="border"
              fontSize="sm"
              _hover={{ borderColor: "primary" }}
              _focus={{
                borderColor: "primary",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
                bg: "surface",
              }}
              transition="all 0.2s ease"
            />
            <FormErrorMessage fontSize="xs">{errors.login}</FormErrorMessage>
          </FormControl>

          {/* Parol */}
          <FormControl mb={6} isInvalid={!!errors.password}>
            <FormLabel
              color="text"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Parol
            </FormLabel>
            <Input
              ref={passInput}
              type="password"
              placeholder="••••••••"
              onChange={() => clearError("password")}
              size="lg"
              borderRadius="xl"
              bg="bg"
              borderColor="border"
              fontSize="sm"
              _hover={{ borderColor: "primary" }}
              _focus={{
                borderColor: "primary",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
                bg: "surface",
              }}
              transition="all 0.2s ease"
            />
            <FormErrorMessage fontSize="xs">{errors.password}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            w="100%"
            h="48px"
            isLoading={loading}
            loadingText="Kirilmoqda..."
            variant="solidPrimary"
            fontSize="sm"
            fontWeight="600"
            borderRadius="xl"
            boxShadow="sm"
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "md",
            }}
            _active={{
              transform: "translateY(0)",
            }}
            transition="all 0.15s ease"
          >
            Tizimga kirish
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
}
