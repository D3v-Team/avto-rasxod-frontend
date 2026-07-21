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
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import { apiEmployees } from "../../Services/api/Users";

// Yagona ohang — sof ko'k
const ACCENT = "#3B82F6";

// Boshlang'ich holat backendga moslab "driver" qilib belgilandi
const emptyForm = { fullName: "", login: "", phone: "", role: "driver" };

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
  const cancelRef = useRef();
  const toast = useToast();

  // Backenddan xodimlarni yuklash
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiEmployees.All();
      const rawData = res.data?.data || res.data || [];

      const mappedAdmins = rawData.map((emp) => ({
        id: emp.id,
        fullName: emp.full_name || "Ismsiz xodim",
        phone: emp.phone || "",
        login:
          emp.login || emp.full_name?.toLowerCase().replace(/\s+/g, "") || "",
        role: emp.role || "driver", // Kelayotgan rol saqlanadi, yo'q bo'lsa default driver
      }));

      setAdmins(mappedAdmins);
    } catch (error) {
      console.error("Xodimlarni yuklashda xatolik:", error);
      toast({
        title: "Ma'lumotlarni yuklab bo'lmadi",
        status: "error",
        duration: 3000,
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
      (a.login?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.phone?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    onOpen();
  }

  function openEditModal(admin) {
    setForm({
      fullName: admin.fullName,
      login: admin.login,
      phone: admin.phone,
      role: admin.role || "driver",
    });
    setEditingId(admin.id);
    onOpen();
  }

  // Xodim yaratish yoki Yangilash
  async function handleSave() {
    if (!form.fullName || !form.phone) {
      toast({
        title: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 2500,
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      full_name: form.fullName,
      phone: form.phone,
      role: form.role, // Har doim toza "driver" qiymati ketadi
    };

    try {
      if (editingId) {
        await apiEmployees.Update(editingId, payload);
      } else {
        await apiEmployees.Create(payload);
      }
      onClose();
      fetchEmployees();
    } finally {
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
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* PAGE HEADER */}
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        mb={5}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Box>
          <Heading size="lg" color="text">
            Xodimlar
          </Heading>
          <Text color="textSecondary" fontSize="sm" mt={1}>
            Tizim haydovchilarini boshqarish
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={18} />}
          bg={ACCENT}
          color="white"
          _hover={{ bg: "#2563EB" }}
          _active={{ bg: "#1D4ED8" }}
          onClick={openCreateModal}
        >
          Yangi xodim
        </Button>
      </Flex>

      {/* SEARCH + COUNT ROW */}
      <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={4}>
        <InputGroup maxW="320px">
          <InputLeftElement pointerEvents="none">
            <Search size={17} color="var(--chakra-colors-muted)" />
          </InputLeftElement>
          <Input
            placeholder="Qidirish..."
            bg="surface"
            border="1.5px solid"
            borderColor="border"
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
          bg={`${ACCENT}1A`}
          color={ACCENT}
        >
          Jami: {filteredAdmins.length} ta
        </Badge>
      </Flex>

      {/* TABLE CARD */}
      <Card bg="surface" border="1px solid" borderColor="border">
        <CardBody p={0}>
          {loading ? (
            <Center py={16}>
              <Spinner color={ACCENT} size="lg" thickness="3px" />
            </Center>
          ) : filteredAdmins.length === 0 ? (
            <Flex direction="column" align="center" py={12} color="muted">
              <Users size={40} />
              <Text mt={3} fontSize="sm">
                Xodim topilmadi
              </Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
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
                      Login
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
                      _hover={{ bg: `${ACCENT}0D` }}
                    >
                      <Td borderColor="border" pl={6}>
                        <Flex align="center" gap={3}>
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
                        </Flex>
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        {admin.login}
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        {admin.phone}
                      </Td>
                      <Td borderColor="border">
                        {/* Rol har doim chiroyli ko'rinishi uchun "Haydovchi" deb chiqariladi */}
                        <Badge
                          fontSize="10px"
                          borderRadius="md"
                          bg={`${ACCENT}1A`}
                          color={ACCENT}
                        >
                          {admin.role === "driver" ? "Haydovchi" : admin.role}
                        </Badge>
                      </Td>
                      <Td borderColor="border" pr={6}>
                        <Flex justify="center" gap={2}>
                          <Tooltip label="Tahrirlash">
                            <IconButton
                              icon={<Pencil size={15} />}
                              size="sm"
                              variant="ghost"
                              color={ACCENT}
                              _hover={{ bg: `${ACCENT}1A` }}
                              aria-label="Tahrirlash"
                              onClick={() => openEditModal(admin)}
                            />
                          </Tooltip>
                          <Tooltip label="O'chirish">
                            <IconButton
                              icon={<Trash2 size={15} />}
                              size="sm"
                              variant="ghost"
                              color="danger"
                              _hover={{ bg: "dangerBg" }}
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

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="surface">
          <ModalHeader bg={"surfBlur"} color="text">
            {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody bg={"bg"}>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">F.I.Sh</FormLabel>
              <Input
                placeholder="Masalan: Doston"
                bg={"surface"}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Login</FormLabel>
              <Input
                bg={"surface"}
                placeholder="Masalan: doston"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Telefon</FormLabel>
              <Input
                type="number"
                defaultValue={"+998"}
                bg={"surface"}
                placeholder="+998 50 589 07 47"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel fontSize="sm">Rol</FormLabel>
              {/* Qiymati faqat driver bo'lgan Select opsiyasi */}
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="driver">Haydovchi (Driver)</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter bg={"surfBlur"} gap={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              onClick={handleSave}
              isLoading={isSubmitting}
            >
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="surface">
          <ModalHeader
            color="text"
            fontSize="lg"
            borderBottom="1px solid"
            borderColor="border"
          >
            Xodimni o'chirish
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody color="textSecondary" py={6}>
            Rostdan ham bu xodimni o'chirmoqchimisiz? Bu amalni ortga qaytarib
            bo'lmaydi.
          </ModalBody>

          <ModalFooter gap={3} borderTop="1px solid" borderColor="border">
            <Button
              variant="ghost"
              onClick={onDeleteClose}
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              _active={{ bg: "red.700" }}
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
