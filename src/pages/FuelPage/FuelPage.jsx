import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  HStack,
  Center,
  Spinner,
  Icon,
  Select,
  SimpleGrid,
  InputGroup,
  InputRightElement,
  Portal,
} from "@chakra-ui/react";
import { MoreVertical, Edit, Trash2, Plus, Fuel } from "lucide-react";

import { apiFuel } from "../../Services/api/Fuels";

const initialFormState = {
  unit: "",
  name: "",
  price: "",
};

// Yoqilg'i turlariga qarab semantic tokenlarni moslashtirish
const getFuelTheme = (name) => {
  if (!name) return { token: "teal.400" };
  const t = name.toLowerCase();
  if (t.includes("benzin") || t.includes("ai")) return { token: "orange.400" };
  if (t.includes("metan") || t.includes("gaz")) return { token: "cyan.400" };
  if (t.includes("propan")) return { token: "purple.400" };
  return { token: "teal.400" };
};

const ACCENT = "#3B82F6";

export default function FuelPage() {
  const [fuels, setFuels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [fuelToDelete, setFuelToDelete] = useState(null);

  const fetchFuels = async () => {
    try {
      setLoading(true);
      const res = await apiFuel.All(1, 100);
      setFuels(res.data?.data ?? res.data ?? []);
    } catch (error) {
      console.error("Yoqilg'ilarni yuklashda xatolik:", error);
      setFuels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialFormState);
    onFormOpen();
  };

  const handleOpenEdit = (fuel) => {
    setModalMode("edit");
    setSelectedFuelId(fuel.id);

    let currentUnit = fuel.unit || fuel.type || "";
    if (currentUnit === "l" || currentUnit === "litr") currentUnit = "litr";
    if (currentUnit === "m3" || currentUnit === "m³" || currentUnit === "kub")
      currentUnit = "m³";
    if (currentUnit === "kg" || currentUnit === "kilogram") currentUnit = "kg";

    setFormData({
      unit: currentUnit,
      name: fuel.name || "",
      price: fuel.price ?? "",
    });

    onFormOpen();
  };

  const handleOpenDelete = (fuel) => {
    setFuelToDelete(fuel);
    onDeleteOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit.trim() || !formData.name.trim() || !formData.price)
      return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await apiFuel.Create(formData);
      } else {
        await apiFuel.Update(selectedFuelId, formData);
      }
      onFormClose();
      fetchFuels();
    } catch (error) {
      console.error("Saqlashda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fuelToDelete?.id) return;
    try {
      setLoading(true);
      await apiFuel.Delete(fuelToDelete.id);
      onDeleteClose();
      fetchFuels();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      bg="bg"
      minH="100vh"
      p={{ base: 4, md: 6 }}
      transition="background 0.2s ease"
    >
      <Box maxW="container.xl" mx="auto">
        {/* Header Section */}
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexWrap="wrap"
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="text" fontWeight="600">
              Yoqilg'i turlari
            </Heading>
            <Text color="textSecondary" fontSize="sm">
              Tizimda mavjud bo'lgan yoqilg'i turlari va ularning joriy narxlari
            </Text>
          </VStack>

          <Button
            leftIcon={<Plus size={18} />}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            _active={{ bg: "#1D4ED8" }}
            onClick={handleOpenCreate}
            px={6}
            boxShadow="sm"
            borderRadius="lg"
          >
            Yaratish
          </Button>
        </Flex>

        {/* Data Grid Section */}
        {loading ? (
          <Center py={16}>
            <VStack spacing={4}>
              <Spinner size="xl" color="primary" thickness="3px" />
              <Text color="textSecondary" fontSize="sm" fontWeight="medium">
                Ma'lumotlar yuklanmoqda...
              </Text>
            </VStack>
          </Center>
        ) : fuels.length === 0 ? (
          <Center py={16}>
            <VStack spacing={3}>
              <Icon
                as={Fuel}
                boxSize={10}
                color="textSecondary"
                opacity={0.4}
              />
              <Text color="textSecondary" fontSize="md">
                Yoqilg'i turlari hali kiritilmagan
              </Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {fuels.map((fuel) => {
              const fuelTheme = getFuelTheme(fuel.name);
              return (
                <Box
                  key={fuel.id}
                  bg="surface"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border"
                  borderTop={`4px solid`}
                  borderTopColor={fuelTheme.token}
                  p={5}
                  boxShadow="sm"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "md",
                  }}
                >
                  {/* Kartochka Tepasi */}
                  <Flex justify="space-between" align="start" mb={6}>
                    <HStack spacing={3}>
                      <Center p={2.5} borderRadius="lg" bg="bg">
                        <Icon as={Fuel} color={fuelTheme.token} boxSize={5} />
                      </Center>
                      <VStack align="start" spacing={0}>
                        <Heading size="sm" color="text" fontWeight="600">
                          {fuel.name}
                        </Heading>
                        <Text
                          fontSize="xs"
                          color="textSecondary"
                          textTransform="lowercase"
                        >
                          birligi: {fuel.unit}
                        </Text>
                      </VStack>
                    </HStack>

                    <Menu isLazy placement="bottom-end" closeOnScroll={false}>
                      <MenuButton
                        as={IconButton}
                        aria-label="Amallar"
                        icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                        color="textSecondary"
                        borderRadius="md"
                        _hover={{ bg: "blackAlpha.50", color: "text" }}
                        _active={{ bg: "blackAlpha.100" }}
                      />
                      <Portal>
                        <MenuList
                          minW="140px"
                          boxShadow="lg"
                          borderColor="border"
                          bg="surface"
                          p="4px"
                          zIndex={1500}
                        >
                          <MenuItem
                            icon={<Edit size={14} />}
                            onClick={() => handleOpenEdit(fuel)}
                            borderRadius="md"
                            bg="surface"
                            _hover={{ bg: "blackAlpha.300" }}
                          >
                            Tahrirlash
                          </MenuItem>
                          <MenuItem
                            icon={<Trash2 size={14} />}
                            onClick={() => handleOpenDelete(fuel)}
                            color="red.500"
                            borderRadius="md"
                            bg="surface"
                            _hover={{ bg: "blackAlpha.300" }}
                          >
                            O'chirish
                          </MenuItem>
                        </MenuList>
                      </Portal>
                    </Menu>
                  </Flex>

                  {/* Kartochka Pasti */}
                  <VStack align="start" spacing={1}>
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      color="textSecondary"
                      letterSpacing="wider"
                    >
                      JORIY NARX
                    </Text>
                    <HStack align="baseline" spacing={1.5}>
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="text"
                        letterSpacing="tight"
                      >
                        {Number(fuel.price).toLocaleString("uz-UZ")}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color="textSecondary"
                      >
                        UZS
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            borderBottom="1px solid"
            borderColor="border"
            fontSize="lg"
            color="text"
            borderTopRadius="xl"
          >
            {modalMode === "create"
              ? "Yangi yoqilg'i qo'shish"
              : "Yoqilg'i ma'lumotini tahrirlash"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={6}>
            <VStack
              spacing={5}
              as="form"
              id="fuel-form"
              onSubmit={handleSubmit}
            >
              {/* O'lchov birligi */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  O'lchov birligi
                </FormLabel>
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="Birlikni tanlang"
                  focusBorderColor="primary"
                  color="text"
                  bg="surface"
                  borderColor="border"
                  _hover={{ borderColor: "primary" }}
                >
                  <option value="l">Litr (L)</option>
                  <option value="m3">Kub metr (m³)</option>
                  <option value="kwh">Kilovatt-soat (kWh)</option>

                  {formData.unit &&
                    !["litr", "m³", "kg"].includes(formData.unit) && (
                      <option value={formData.unit}>{formData.unit}</option>
                    )}
                </Select>
              </FormControl>

              {/* Markasi yoki Nomi */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  Markasi yoki Nomi
                </FormLabel>
                <Select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Yoqilg'i markasini tanlang"
                  focusBorderColor="primary"
                  color="text"
                  bg="surface"
                  borderColor="border"
                  _hover={{ borderColor: "primary" }}
                >
                  <option value="AI-92">AI-92</option>
                  <option value="AI-95">AI-95</option>
                  <option value="AI-98">AI-98</option>
                  <option value="AI-100">AI-100</option>
                  <option value="Metan">Metan</option>
                  <option value="Propan">Propan</option>
                  <option value="Dizel">Dizel</option>
                  <option value="Dizel EKO">Dizel EKO</option>

                  {formData.name &&
                    ![
                      "AI-92",
                      "AI-95",
                      "AI-98",
                      "Metan",
                      "Propan",
                      "Dizel",
                      "Dizel EKO",
                    ].includes(formData.name) && (
                      <option value={formData.name}>{formData.name}</option>
                    )}
                </Select>
              </FormControl>

              {/* Narxi */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  Narxi
                </FormLabel>
                <InputGroup>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="9200"
                    focusBorderColor="primary"
                    color="text"
                    bg="surface"
                    borderColor="border"
                    _hover={{ borderColor: "primary" }}
                    pr="4.5rem"
                  />
                  <InputRightElement
                    width="4.5rem"
                    h="100%"
                    pointerEvents="none"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="textSecondary"
                      pr={3}
                    >
                      UZS
                    </Text>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surfBlur"
            borderBottomRadius="xl"
          >
            <Button
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onFormClose}
              size="sm"
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              type="submit"
              form="fuel-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
            >
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            fontSize="lg"
            color={"text"}
            borderTopRadius="xl"
          >
            O'chirishni tasdiqlang
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />
          <ModalBody bg="bg" py={4}>
            <Text color="text">
              Siz rostdan ham <b>{fuelToDelete?.name}</b> yoqilg'i ma'lumotini
              o'chirmoqchimisiz?
            </Text>
            <Text mt={2} fontSize="sm" color="textSecondary">
              Ushbu amalni ortga qaytarib bo'lmaydi.
            </Text>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surfBlur"
            borderBottomRadius="xl"
          >
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onDeleteClose}
            >
              Bekor qilish
            </Button>
            <Button
              size="sm"
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={handleConfirmDelete}
              isLoading={loading}
            >
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
