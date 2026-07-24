import { useState, useEffect, useRef, useMemo } from "react";
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
  Avatar,
  Tooltip,
  Spinner,
  Center,
  HStack,
  VStack,
} from "@chakra-ui/react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiEmployees } from "../../Services/api/Users";
import toast from "react-hot-toast";

const ACCENT = "#3B82F6";
const ITEMS_PER_PAGE = 10;
const emptyForm = { fullName: "", phone: "", role: "driver" };

export default function AdminPage() {
  const [admins, setAdmins] = useState([]);
  
  // Yuklanish holatlari (CarPage bilan bir xil logic)
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination holatlari
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  // Smooth yuklanish uchun Ref'lar
  const hasLoadedOnceRef = useRef(false);
  const fetchIdRef = useRef(0);
  const didMountRef = useRef(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Backenddan xodimlarni yuklash (Background Fetch)
  const fetchEmployees = async (targetPage = currentPage, searchQuery = search) => {
    const fetchId = ++fetchIdRef.current;

    // Birinchi marta kirganda Spinner, keyingilarida background fetching (isFetching)
    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const res = await apiEmployees.All("", searchQuery, targetPage, ITEMS_PER_PAGE);

      if (fetchIdRef.current !== fetchId) return; // Eski so'rov bo'lsa to'xtatamiz

      const responseData = res.data?.data || res.data || {};
      const rawData = responseData.records || (Array.isArray(responseData) ? responseData : []);
      const paginationData = responseData.pagination || {};

      const mappedAdmins = rawData.map((emp) => ({
        id: emp.id,
        fullName: emp.full_name || emp.fullName || "Ismsiz xodim",
        phone: emp.phone || "",
        role: emp.role || "driver",
      }));

      setAdmins(mappedAdmins);

      const total = paginationData.total_count || responseData.total || mappedAdmins.length;
      const pages = paginationData.total_pages || responseData.totalPages || Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

      setTotalItems(total);
      setServerTotalPages(pages);

      if (mappedAdmins.length === 0 && targetPage > 1 && targetPage > pages) {
        setCurrentPage(pages);
      }
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;
      console.error("Xodimlarni yuklashda xatolik:", error);
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
        setIsFetching(false);
        hasLoadedOnceRef.current = true;
      }
    }
  };

  // Search va Page o'zgarganda yuklash
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      fetchEmployees(currentPage, search);
      return;
    }

    const timer = setTimeout(() => {
      fetchEmployees(currentPage, search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, currentPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Pagination hisob-kitoblari (CarPage bilan bir xil)
  const totalPages = useMemo(() => Math.max(1, serverTotalPages), [serverTotalPages]);
  const safeCurrentPage = useMemo(() => Math.min(currentPage, totalPages), [currentPage, totalPages]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

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

  async function handleSave(e) {
    e?.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) return;

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
      fetchEmployees(currentPage, search);
    } catch (err) {
      console.error(err);
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

      const nextPage = admins.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchEmployees(currentPage, search);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      bg="bg"
      minH="100vh"
      w="100%"
      p={{ base: 4, md: 6 }}
      transition="background 0.2s ease"
    >
      <Box w="100%" maxW="100%" mx="auto">
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

        {/* SEARCH + COUNT ROW */}
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
              onChange={handleSearchChange}
            />
          </InputGroup>

          {/* YANGILANISH INDIKATORI + BADGE */}
          <HStack spacing={3}>
            {isFetching && (
              <HStack spacing={1.5} color="textSecondary">
                <Spinner size="xs" color={ACCENT} thickness="2px" />
                <Text fontSize="xs">Yangilanmoqda...</Text>
              </HStack>
            )}
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
              Jami: {totalItems} ta
            </Badge>
          </HStack>
        </Flex>

        {/* TABLE CARD SECTION */}
        <Card
          bg="surface"
          border="1px solid"
          borderColor="border"
          borderRadius="xl"
          boxShadow="sm"
          w="100%"
        >
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
            ) : admins.length === 0 && !isFetching ? (
              <Center py={16}>
                <VStack spacing={3}>
                  <Users
                    size={40}
                    opacity={0.3}
                    color="var(--chakra-colors-textSecondary)"
                  />
                  <Text color="textSecondary" fontSize="md">
                    Xodim topilmadi
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Box
                w="100%"
                overflow="hidden"
                opacity={isFetching ? 0.55 : 1}
                pointerEvents={isFetching ? "none" : "auto"}
                transition="opacity 0.15s ease"
              >
                <Table variant="simple" size="md" w="100%">
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
                    {admins.map((admin) => (
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

                        <Td
                          borderColor="border"
                          color="textSecondary"
                          fontSize="sm"
                        >
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

            {/* CAR PAGE BILING BIR XIL PAGINATION CONTROLS */}
            {!loading && totalItems > 0 && (
              <Flex
                justify="space-between"
                align="center"
                px={6}
                py={4}
                borderTop="1px solid"
                borderColor="border"
                flexWrap="wrap"
                gap={3}
              >
                <Text fontSize="xs" color="textSecondary">
                  {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems)} /{" "}
                  {totalItems} ta ko'rsatilmoqda
                </Text>

                <HStack spacing={1.5}>
                  <IconButton
                    icon={<ChevronLeft size={16} />}
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    color="textSecondary"
                    borderRadius="lg"
                    aria-label="Oldingi sahifa"
                    isDisabled={safeCurrentPage === 1}
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    _hover={{ bg: "blackAlpha.50", color: "text" }}
                  />

                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      minW="36px"
                      borderRadius="lg"
                      fontWeight="600"
                      fontSize="xs"
                      bg={page === safeCurrentPage ? ACCENT : "transparent"}
                      color={
                        page === safeCurrentPage ? "white" : "textSecondary"
                      }
                      border="1px solid"
                      borderColor={page === safeCurrentPage ? ACCENT : "border"}
                      _hover={{
                        bg: page === safeCurrentPage ? ACCENT : "blackAlpha.50",
                        color: page === safeCurrentPage ? "white" : "text",
                      }}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <IconButton
                    icon={<ChevronRight size={16} />}
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    color="textSecondary"
                    borderRadius="lg"
                    aria-label="Keyingi sahifa"
                    isDisabled={safeCurrentPage === totalPages}
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    _hover={{ bg: "blackAlpha.50", color: "text" }}
                  />
                </HStack>
              </Flex>
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
            {editingId
              ? "Xodim ma'lumotlarini tahrirlash"
              : "Yangi xodim qo'shish"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={6}>
            <VStack
              spacing={5}
              as="form"
              id="employee-form"
              onSubmit={handleSave}
            >
              {/* F.I.Sh */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  F.I.Sh
                </FormLabel>
                <Input
                  placeholder="Masalan: Ali valiyev"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
              </FormControl>

              {/* Telefon */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  Telefon raqam
                </FormLabel>
                <InputGroup>
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
                    pl="4.5rem"
                    value={form.phone.replace("+998", "")}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 9);
                      setForm({ ...form, phone: `+998${val}` });
                    }}
                  />
                </InputGroup>
              </FormControl>

              {/* Rol */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
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
                  <option value="responsible">
                    Mas'ul xodim (Responsible)
                  </option>
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
