import { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  useDisclosure,
  useToast,
  Avatar,
  Tooltip,
  Spinner,
  Center,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import { apiEmployees } from "../../Services/api/Users";

// Yagona brend rangi
const ACCENT = "#3B82F6";

// Boshlang'ich holat
const emptyForm = { fullName: "", phone: "", role: "driver" };

export default function AdminPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const toast = useToast();

  // Backenddan xodimlarni yuklash
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiEmployees.All();
      const rawData = res.data?.data || res.data || [];

      const mappedAdmins = rawData.map((emp) => ({
        id: emp.id,
        fullName: emp.full_name || emp.fullName || "Ismsiz xodim",
        phone: emp.phone || "",
        role: emp.role || "driver",
      }));

      setAdmins(mappedAdmins);
    } catch (error) {
      console.error("Xodimlarni yuklashda xatolik:", error);
      toast({
        title: "Ma'lumotlarni yuklab bo'lmadi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredAdmins = admins.filter(
    (a) =>
      (a.fullName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.phone?.toLowerCase() || "").includes(search.toLowerCase())
  );

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    onOpen();
  }

  function openEditModal(admin) {
    setForm({
      fullName: admin.fullName,
      phone: admin.phone,
      role: admin.role || "driver",
    });
    setEditingId(admin.id);
    onOpen();
  }

  // Xodim yaratish yoki Yangilash
  async function handleSave(e) {
    e?.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
     
      return;
    }

    setIsSubmitting(true);

    const payload = {
      full_name: form.fullName,
      phone: form.phone,
      role: form.role,
    };

    try {
      if (editingId) {
        await apiEmployees.Update(editingId, payload);
       
      } else {
        await apiEmployees.Create(payload);
       
      }
      onClose();
      fetchEmployees();
    }  finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(id) {
    setDeleteId(id);
    onDeleteOpen();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await apiEmployees.Delete(deleteId);
     
      onDeleteClose();
      fetchEmployees();
    }  finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      bg="bg"
      minH="100vh"
      p={{ base: 4, md: 6 }}
      transition="background 0.2s ease"
    >
      <Box maxW="container.xl" mx="auto">
        {/* HEADER SECTION */}
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexWrap="wrap"
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="text" fontWeight="600">
              Xodimlar
            </Heading>
            <Text color="textSecondary" fontSize="sm">
              Tizim xodimlari va haydovchilar ro'yxati hamda ularni boshqarish
            </Text>
          </VStack>

          <Button
            leftIcon={<Plus size={18} />}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            _active={{ bg: "#1D4ED8" }}
            onClick={openCreateModal}
            px={6}
            boxShadow="sm"
            borderRadius="lg"
          >
            Yangi xodim
          </Button>
        </Flex>

        {/* SEARCH + BADGE ROW */}
        <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={5}>
          <InputGroup maxW="320px">
            <InputLeftElement pointerEvents="none">
              <Search size={17} color="var(--chakra-colors-textSecondary)" />
            </InputLeftElement>
            <Input
              placeholder="Qidirish..."
              bg="surface"
              border="1px solid"
              borderColor="border"
              color="text"
              borderRadius="lg"
              _hover={{ borderColor: ACCENT }}
              _focus={{
                borderColor: ACCENT,
                boxShadow: `0 0 0 3px ${ACCENT}26`,
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Badge
            fontSize="xs"
            px={3}
            py={1.5}
            borderRadius="lg"
            bg="blackAlpha.50"
            color="textSecondary"
            border="1px solid"
            borderColor="border"
          >
            Jami: {filteredAdmins.length} ta
          </Badge>
        </Flex>

        {/* TABLE CARD SECTION */}
        <Card bg="surface" border="1px solid" borderColor="border" borderRadius="xl" boxShadow="sm">
          <CardBody p={0}>
            {loading ? (
              <Center py={16}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="primary" thickness="3px" />
                  <Text color="textSecondary" fontSize="sm" fontWeight="medium">
                    Ma'lumotlar yuklanmoqda...
                  </Text>
                </VStack>
              </Center>
            ) : filteredAdmins.length === 0 ? (
              <Center py={16}>
                <VStack spacing={3}>
                  <Users size={40} opacity={0.3} color="var(--chakra-colors-textSecondary)" />
                  <Text color="textSecondary" fontSize="md">
                    Xodim topilmadi
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr bg="surfBlur">
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={4}
                        pl={6}
                      >
                        F.I.Sh
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Telefon
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Rol
                      </Th>
                      <Th
                        textAlign="center"
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        pr={6}
                      >
                        Amallar
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAdmins.map((admin) => (
                      <Tr
                        key={admin.id}
                        transition="background 0.15s ease"
                        _hover={{ bg: "blackAlpha.50" }}
                      >
                        <Td borderColor="border" pl={6} py={3.5}>
                          <HStack spacing={3}>
                            <Avatar
                              size="sm"
                              name={admin.fullName}
                              bg={ACCENT}
                              color="white"
                              fontSize="xs"
                              fontWeight="700"
                            />
                            <Text fontWeight="600" color="text">
                              {admin.fullName}
                            </Text>
                          </HStack>
                        </Td>

                        <Td borderColor="border" color="textSecondary" fontSize="sm">
                          {admin.phone}
                        </Td>

                        <Td borderColor="border">
                          {admin.role === "responsible" ? (
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              bg="purple.50"
                              color="purple.600"
                              border="1px solid"
                              borderColor="purple.200"
                            >
                              Mas'ul xodim
                            </Badge>
                          ) : (
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              bg="blue.50"
                              color="blue.600"
                              border="1px solid"
                              borderColor="blue.200"
                            >
                              Haydovchi
                            </Badge>
                          )}
                        </Td>

                        <Td borderColor="border" pr={6}>
                          <Flex justify="center" gap={1}>
                            <Tooltip label="Tahrirlash">
                              <IconButton
                                icon={<Pencil size={15} />}
                                size="sm"
                                variant="ghost"
                                color="textSecondary"
                                borderRadius="md"
                                _hover={{ bg: "blackAlpha.50", color: "text" }}
                                aria-label="Tahrirlash"
                                onClick={() => openEditModal(admin)}
                              />
                            </Tooltip>
                            <Tooltip label="O'chirish">
                              <IconButton
                                icon={<Trash2 size={15} />}
                                size="sm"
                                variant="ghost"
                                color="red.500"
                                borderRadius="md"
                                _hover={{ bg: "red.50" }}
                                aria-label="O'chirish"
                                onClick={() => confirmDelete(admin.id)}
                              />
                            </Tooltip>
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
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
            {editingId ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={6}>
            <VStack spacing={5} as="form" id="employee-form" onSubmit={handleSave}>
              {/* F.I.Sh */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  F.I.Sh
                </FormLabel>
                <Input
                  placeholder="Masalan: Doston Ergashev"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </FormControl>

            <FormControl isRequired>
  <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
    Telefon raqam
  </FormLabel>
  <InputGroup>
    {/* Chap tomonda permanent +998 prefiksi */}
    <InputLeftElement pointerEvents="none" w="4.5rem">
      <Text fontSize="sm" fontWeight="600" color="textSecondary">
        +998
      </Text>
    </InputLeftElement>
    <Input
      type="number"
      placeholder="901234567"
      bg="surface"
      color="text"
      borderColor="border"
      focusBorderColor="primary"
      _hover={{ borderColor: ACCENT }}
      pl="4.5rem" // Chapdan joy tashlash
      value={form.phone.replace("+998", "")} // Agarda form.phone ichida +998 bo'lsa, uni kesib ko'rsatadi
      onChange={(e) => {
        const val = e.target.value.slice(0, 9); // Ko'pi bilan 9 ta raqam
        setForm({ ...form, phone: `+998${val}` });
      }}
    />
  </InputGroup>
</FormControl>

              {/* Rol */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Xodim roli
                </FormLabel>
                <Select
                  value={form.role}
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="driver">Haydovchi (Driver)</option>
                  <option value="responsible">Mas'ul xodim (Responsible)</option>
                </Select>
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
              onClick={onClose}
              size="sm"
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              type="submit"
              form="employee-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
            >
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            fontSize="lg"
            color="red.500"
            borderTopRadius="xl"
          >
            O'chirishni tasdiqlang
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={4}>
            <Text color="text">
              Siz rostdan ham ushbu xodimni o'chirmoqchimisiz?
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
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              size="sm"
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={handleDelete}
              isLoading={isSubmitting}
            >
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}