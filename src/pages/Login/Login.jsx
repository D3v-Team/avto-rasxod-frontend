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
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Auth } from "../../Services/api/Auth";
import { useAuth } from "../../hooks/useAuth";
import { toastService } from "../../utils/toast";
import { useNavigate } from "react-router";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // UI states
  const [loading, setLoading] = useState(false);

  const passInput = useRef("");
  const logInput = useRef("");

  const [errors, setErrors] = useState({ login: "", password: "" });

  // ❗ Input o'zgarsa error avtomatik tozalanadi
  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginText = logInput.current.value.trim();
    const password = passInput.current.value.trim();

    let newErrors = {};

    // Login validation
    if (!loginText) {
      newErrors.login = "Login kiritilmadi";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Parol kiritilmadi";
    } else if (password.length < 6) {
      newErrors.password = "Parol kamida 6 belgidan iborat bo'lishi kerak";
    }

    setErrors(newErrors);

    // Agar hatolik bo'lsa API chaqirilmaydi
    if (Object.keys(newErrors).length > 0) return;

    try {
      const payload = {
        username: logInput.current.value,
        password: passInput.current.value,
      };

      setLoading(true);

      const res = await Auth.Login(payload);

      if (res.status !== 200 && res.status !== 201) {
        toastService.error(res?.data?.message || "Login xatosi");
        return;
      }

      const data = res.data;

      login({
        token: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
        user: data.user,
      });

      if (data.user.role !== "super_admin" && data.user.role !== "admin") {
        toastService.error("Sizda tizimga kirish huquqi yo'q.");
        return;
      }

      toastService.success("Welcome Boss!");

      if (data.user.role === "super_admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/xodim/dashboard", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="bg" px={4}>
      {/* Dark/Light toggle button */}
      {/* <Button
                    position="absolute"
                    top="20px"
                    right="20px"
                    size="sm"
                    onClick={toggleColorMode}
                >
                    Tema
                </Button> */}
      <Box
        as="form"
        onSubmit={(e) => handleSubmit(e)}
        w={{ base: "100%", sm: "400px" }}
        bg="surface"
        p={8}
        rounded="xl"
        shadow="lg"
      >
        {/* Logo */}

        {/* Title */}
        <Heading textAlign="center" size="lg" mb={2} color="text">
          Login
        </Heading>

        {/* Subtitle */}
        <Text textAlign="center" color="gray.500" mb={6}>
          Tizimga kirish uchun ma’lumotlarni kiriting
        </Text>

        {/* Login input */}
        <FormControl mb={4} isInvalid={!!errors.login}>
          <FormLabel color="text">Login</FormLabel>
          <Input
            ref={logInput}
            placeholder="Loginni kiriting"
            onChange={() => clearError("login")}
          />
          <FormErrorMessage>{errors.login}</FormErrorMessage>
        </FormControl>

        {/* Password input */}
        <FormControl mb={2} isInvalid={!!errors.password}>
          <FormLabel color="text">Parol</FormLabel>
          <Input
            ref={passInput}
            type="password"
            placeholder="Parolni kiriting"
            onChange={() => clearError("password")}
          />
          <FormErrorMessage>{errors.password}</FormErrorMessage>
        </FormControl>

        {/* Forgot password */}

        {/* Login button */}
        <Button
          type="submit"
          style={{ cursor: loading ? "progress" : "pointer" }}
          w="100%"
          mt={"15px"}
          isLoading={loading}
          _hover={{ bg: "secondary" }}
          loadingText="Loading..."
          variant="solidPrimary"
        >
          Kirish
        </Button>
      </Box>
    </Flex>
  );
}
