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

const ACCENT = "#3B82F6";
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
    <Box bg="bg" minH="100vh" w="100%" p={6} transition="background 0.2s ease">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="text" fontWeight="600">
          Adminlar
        </Heading>
        <HStack>
          <IconButton
            aria-label="Yangilash"
            icon={<RepeatIcon />}
            onClick={() => fetchAdmins(page)}
            isLoading={loading}
            bg="surface"
            color="text"
            border="1px solid"
            borderColor="border"
            _hover={{ bg: "blackAlpha.50" }}
            borderRadius="lg"
          />
          <Button
            leftIcon={<AddIcon />}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            _active={{ bg: "#1D4ED8" }}
            onClick={openCreateModal}
            borderRadius="lg"
            boxShadow="sm"
          >
            Admin qo'shish
          </Button>
        </HStack>
      </Flex>

      <Box
        bg="surface"
        border="1px solid"
        borderColor="border"
        borderRadius="xl"
        overflow="hidden"
        boxShadow="sm"
      >
        <TableContainer>
          <Table variant="simple">
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
                  To'liq ism
                </Th>
                <Th
                  color="textSecondary"
                  fontSize="xs"
                  letterSpacing="0.5px"
                  borderColor="border"
                >
                  Username
                </Th>
                <Th
                  textAlign="right"
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
              {loading ? (
                <Tr>
                  <Td
                    colSpan={3}
                    textAlign="center"
                    py={10}
                    borderColor="border"
                  >
                    <Spinner color="primary" />
                  </Td>
                </Tr>
              ) : admins.length === 0 ? (
                <Tr>
                  <Td
                    colSpan={3}
                    textAlign="center"
                    py={10}
                    borderColor="border"
                  >
                    <Text color="textSecondary">Adminlar topilmadi</Text>
                  </Td>
                </Tr>
              ) : (
                admins.map((admin) => (
                  <Tr
                    key={admin.id}
                    transition="background 0.15s ease"
                    _hover={{ bg: "blackAlpha.50" }}
                  >
                    <Td
                      borderColor="border"
                      pl={6}
                      color="text"
                      fontWeight="600"
                    >
                      {admin.full_name}
                    </Td>
                    <Td borderColor="border" color="textSecondary">
                      {admin.username}
                    </Td>
                    <Td borderColor="border" pr={6} textAlign="right">
                      <HStack justify="flex-end" spacing={1}>
                        <IconButton
                          aria-label="Tahrirlash"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          color="textSecondary"
                          borderRadius="md"
                          _hover={{ bg: "blackAlpha.50", color: "text" }}
                          onClick={() => openEditModal(admin)}
                        />
                        <IconButton
                          aria-label="O'chirish"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          color="red.500"
                          borderRadius="md"
                          _hover={{ bg: "red.50" }}
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
      <Flex justify="center" mt={4} gap={2} align="center">
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page <= 1}
          variant="outline"
          borderColor="border"
          color="text"
          _hover={{ bg: "blackAlpha.50" }}
          borderRadius="lg"
        >
          Oldingi
        </Button>
        <Text alignSelf="center" color="textSecondary" fontSize="sm">
          {page} / {totalPages}
        </Text>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page >= totalPages}
          variant="outline"
          borderColor="border"
          color="text"
          _hover={{ bg: "blackAlpha.50" }}
          borderRadius="lg"
        >
          Keyingi
        </Button>
      </Flex>

      {/* Create / Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
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
            {editingAdmin ? "Adminni tahrirlash" : "Yangi admin"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />
          <ModalBody bg="bg" py={6}>
            <FormControl mb={4}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="textSecondary"
              >
                To'liq ism
              </FormLabel>
              <Input
                name="full_name"
                value={form.full_name}
                onChange={handleFormChange}
                placeholder="John Doe"
                bg="surface"
                color="text"
                borderColor="border"
                focusBorderColor="primary"
                _hover={{ borderColor: ACCENT }}
              />
            </FormControl>
            <FormControl mb={form.password || !editingAdmin ? 4 : 0}>
              <FormLabel
                fontSize="sm"
                fontWeight="medium"
                color="textSecondary"
              >
                Username
              </FormLabel>
              <Input
                name="username"
                value={form.username}
                onChange={handleFormChange}
                placeholder="john"
                bg="surface"
                color="text"
                borderColor="border"
                focusBorderColor="primary"
                _hover={{ borderColor: ACCENT }}
              />
            </FormControl>
            {!editingAdmin && (
              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  Parol
                </FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="••••••••"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                />
              </FormControl>
            )}
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
              isDisabled={saving}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              onClick={handleSave}
              isLoading={saving}
              size="sm"
              px={6}
            >
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.400" backdropFilter="blur(3px)">
          <AlertDialogContent borderRadius="xl" bg="surface" boxShadow="2xl">
            <AlertDialogHeader
              bg="surfBlur"
              fontSize="lg"
              color="text"
              borderTopRadius="xl"
              borderBottom="1px solid"
              borderColor="border"
            >
              O'chirishni tasdiqlang
            </AlertDialogHeader>
            <AlertDialogBody bg="bg" py={4}>
              <Text color="text">
                Siz rostdan ham{" "}
                <Text as="span" fontWeight="700">
                  {deletingAdmin?.full_name}
                </Text>{" "}
                ({deletingAdmin?.username}) ma'lumotini o'chirmoqchimisiz?
              </Text>
              <Text mt={2} fontSize="sm" color="textSecondary">
                Ushbu amalni ortga qaytarib bo'lmaydi.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter
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
                isDisabled={deleting}
              >
                Bekor qilish
              </Button>
              <Button
                size="sm"
                bg="red.500"
                color="white"
                _hover={{ bg: "red.600" }}
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
