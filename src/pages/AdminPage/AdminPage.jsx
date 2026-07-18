import { useState, useRef } from "react";
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
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Avatar,
  Tooltip,
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";

// Yagona ohang — sof ko'k
const ACCENT = "#3B82F6";

// Fake/mock data — API tayyor bo'lgach almashtiriladi
const initialAdmins = [
  {
    id: 1,
    fullName: "Р.Турсунмурадов",
    login: "r.tursunmurodov",
    phone: "+998 90 123 45 67",
    role: "Bosh admin",
  },
  {
    id: 2,
    fullName: "И.Худойбердиев",
    login: "i.xudoyberdiev",
    phone: "+998 91 234 56 78",
    role: "Admin",
  },
  {
    id: 3,
    fullName: "С.Акрамов",
    login: "s.akramov",
    phone: "+998 93 345 67 89",
    role: "Admin",
  },
];

const emptyForm = { fullName: "", login: "", phone: "", role: "Admin" };

export default function AdminPage() {
  const [admins, setAdmins] = useState(initialAdmins);
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

  const filteredAdmins = admins.filter(
    (a) =>
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.login.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.toLowerCase().includes(search.toLowerCase()),
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
      role: admin.role,
    });
    setEditingId(admin.id);
    onOpen();
  }

  function handleSave() {
    if (!form.fullName || !form.login || !form.phone) {
      toast({
        title: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 2500,
      });
      return;
    }

    if (editingId) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)),
      );
      toast({ title: "Xodim yangilandi", status: "success", duration: 2000 });
    } else {
      const newAdmin = { id: Date.now(), ...form };
      setAdmins((prev) => [...prev, newAdmin]);
      toast({ title: "Xodim qo'shildi", status: "success", duration: 2000 });
    }

    onClose();
  }

  function confirmDelete(id) {
    setDeleteId(id);
    onDeleteOpen();
  }

  function handleDelete() {
    setAdmins((prev) => prev.filter((a) => a.id !== deleteId));
    toast({ title: "Xodim o'chirildi", status: "info", duration: 2000 });
    onDeleteClose();
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
            Tizim adminlarini boshqarish
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
          {filteredAdmins.length === 0 ? (
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
                        <Badge
                          fontSize="10px"
                          borderRadius="md"
                          bg={
                            admin.role === "Bosh admin" ? ACCENT : `${ACCENT}1A`
                          }
                          color={admin.role === "Bosh admin" ? "white" : ACCENT}
                        >
                          {admin.role}
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
                              isDisabled={admin.role === "Bosh admin"}
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
          <ModalHeader color="text">
            {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">F.I.Sh</FormLabel>
              <Input
                placeholder="Masalan: Р.Турсунмурадов"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Login</FormLabel>
              <Input
                placeholder="Masalan: r.tursunmurodov"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Telefon</FormLabel>
              <Input
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel fontSize="sm">Rol</FormLabel>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Admin">Admin</option>
                <option value="Bosh admin">Bosh admin</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              onClick={handleSave}
            >
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="surface">
            <AlertDialogHeader color="text">
              Xodimni o'chirish
            </AlertDialogHeader>
            <AlertDialogBody color="textSecondary">
              Rostdan ham bu xodimni o'chirmoqchimisiz? Bu amalni ortga qaytarib
              bo'lmaydi.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={onDeleteClose}>
                Bekor qilish
              </Button>
              <Button variant="solidDanger" onClick={handleDelete}>
                O'chirish
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
