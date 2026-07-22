import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  Spinner,
  useToast,
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
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Text,
  Flex,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon, RepeatIcon } from "@chakra-ui/icons";
import { apiAdmin } from "../../../Services/api/apiAdmin";

const PAGE_LIMIT = 10;

function Admin() {
  const toast = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create / edit modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingAdmin, setEditingAdmin] = useState(null); // null = create mode
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete confirm dialog
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showError = (title, err) => {
    toast({
      title,
      description:
        err?.response?.data?.message ||
        err?.message ||
        "Nomaʼlum xatolik yuz berdi",
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  };

  // ---- Fetch paginated admins ----
  const fetchAdmins = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const res = await apiAdmin.Page(pageToLoad, PAGE_LIMIT);
      const data = res.data;

      // eslint-disable-next-line no-console
      console.log("GET /user/page javobi:", data);

      // Defensive parsing - matches the { records, pagination } shape from the API
      let list = data?.records || data?.data?.records || data?.data || data;
      if (!Array.isArray(list)) list = [];

      const total =
        data?.pagination?.total ??
        data?.pagination?.totalCount ??
        data?.total ??
        list.length;
      const limit = data?.pagination?.limit ?? data?.limit ?? PAGE_LIMIT;
      const totalPagesFromApi =
        data?.pagination?.totalPages ?? data?.totalPages ?? null;

      setAdmins(list);
      setTotalPages(totalPagesFromApi ?? Math.max(1, Math.ceil(total / limit)));
    } catch (err) {
      showError("Adminlarni yuklashda xatolik", err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins(page);
  }, [page, fetchAdmins]);

  // ---- Create / Update ----
  const openCreateModal = () => {
    setEditingAdmin(null);
    setForm({ full_name: "", username: "", password: "" });
    onOpen();
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setForm({
      full_name: admin.full_name || "",
      username: admin.username || "",
      password: "",
    });
    onOpen();
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAdmin) {
        await apiAdmin.Update(editingAdmin.id, {
          full_name: form.full_name,
          username: form.username,
        });
      } else {
        await apiAdmin.Create({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
        });
      }

      onClose();
      fetchAdmins(page);
    } catch (err) {
      showError("Saqlashda xatolik", err);
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const openDeleteConfirm = (admin) => {
    setDeletingAdmin(admin);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    setDeleting(true);
    try {
      await apiAdmin.Delete(deletingAdmin.id);
      onDeleteClose();
      fetchAdmins(page);
    } catch (err) {
      showError("O'chirishda xatolik", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Adminlar</Heading>
        <HStack>
          <IconButton
            aria-label="Yangilash"
            icon={<RepeatIcon />}
            onClick={() => fetchAdmins(page)}
            isLoading={loading}
          />
          <Button
            leftIcon={<AddIcon />}
            colorScheme="teal"
            onClick={openCreateModal}
          >
            Admin qo'shish
          </Button>
        </HStack>
      </Flex>

      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>To'liq ism</Th>
                <Th>Username</Th>
                <Th textAlign="right">Amallar</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={3} textAlign="center" py={10}>
                    <Spinner />
                  </Td>
                </Tr>
              ) : admins.length === 0 ? (
                <Tr>
                  <Td colSpan={3} textAlign="center" py={10}>
                    <Text color="gray.500">Adminlar topilmadi</Text>
                  </Td>
                </Tr>
              ) : (
                admins.map((admin) => (
                  <Tr key={admin.id}>
                    <Td>{admin.full_name}</Td>
                    <Td>{admin.username}</Td>
                    <Td textAlign="right">
                      <HStack justify="flex-end" spacing={2}>
                        <IconButton
                          aria-label="Tahrirlash"
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => openEditModal(admin)}
                        />
                        <IconButton
                          aria-label="O'chirish"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => openDeleteConfirm(admin)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      <Flex justify="center" mt={4} gap={2}>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page <= 1}
        >
          Oldingi
        </Button>
        <Text alignSelf="center">
          {page} / {totalPages}
        </Text>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page >= totalPages}
        >
          Keyingi
        </Button>
      </Flex>

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingAdmin ? "Adminni tahrirlash" : "Yangi admin"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>To'liq ism</FormLabel>
              <Input
                name="full_name"
                value={form.full_name}
                onChange={handleFormChange}
                placeholder="John Doe"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                value={form.username}
                onChange={handleFormChange}
                placeholder="john"
              />
            </FormControl>
            {!editingAdmin && (
              <FormControl mb={3}>
                <FormLabel>Parol</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                />
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Bekor qilish
            </Button>
            <Button colorScheme="teal" onClick={handleSave} isLoading={saving}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Adminni o'chirish</AlertDialogHeader>
            <AlertDialogBody>
              <strong>{deletingAdmin?.full_name}</strong> (
              {deletingAdmin?.username}) ni rostdan ham o'chirmoqchimisiz? Bu
              amalni ortga qaytarib bo'lmaydi.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose} mr={3}>
                Bekor qilish
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={deleting}
              >
                O'chirish
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default Admin;
