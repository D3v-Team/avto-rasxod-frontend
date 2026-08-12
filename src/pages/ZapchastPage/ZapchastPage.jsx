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
  NumberInput,
  NumberInputField,
  useDisclosure,
  Tooltip,
  Spinner,
  Center,
  HStack,
  VStack,
  SimpleGrid,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { apiCars } from "../../Services/api/Cars";
import toast from "react-hot-toast";
import { apiZapchast } from "../../Services/api/apiZapchast";

const ACCENT = "#3B82F6";
const ITEMS_PER_PAGE = 10;
const PAYMENT_TYPES = ["Karta", "Prechisleniye"];

// localStorage kalitlari (Yil/Oy filtrini eslab qolish uchun)
const LS_YEAR_KEY = "zapchast_filterYear";
const LS_MONTH_KEY = "zapchast_filterMonth";

const emptyForm = {
  car_id: "",
  part_name: "",
  unit: "",
  quantity: 0,
  payment_type: "Karta",
  price: 0,
  total_price: 0,
  note: "",
  date: new Date().toISOString().slice(0, 10),
};

const paymentBadgeStyle = {
  Karta: { bg: "blue.50", color: "blue.600", border: "blue.200" },
  Prechisleniye: { bg: "purple.50", color: "purple.600", border: "purple.200" },
};

const formatSum = (n) => Number(n || 0).toLocaleString("uz-UZ");

const MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

// Joriy yil/oyni default qilib olish, agar avval saqlangan qiymat bo'lsa o'shani ishlatish
function getDefaultYear() {
  try {
    const saved = localStorage.getItem(LS_YEAR_KEY);
    if (saved) return saved;
  } catch (e) {
    // localStorage mavjud bo'lmasa (SSR va h.k.) e'tiborsiz qoldiramiz
  }
  return String(new Date().getFullYear());
}

function getDefaultMonth() {
  try {
    const saved = localStorage.getItem(LS_MONTH_KEY);
    if (saved) return saved;
  } catch (e) {
    // localStorage mavjud bo'lmasa (SSR va h.k.) e'tiborsiz qoldiramiz
  }
  return String(new Date().getMonth() + 1);
}

export default function ZapchastPage() {
  const [parts, setParts] = useState([]);
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Yil va Oy uchun default qiymat: localStorage'da saqlangan bo'lsa o'sha, bo'lmasa joriy yil/oy
  const [filterYear, setFilterYear] = useState(getDefaultYear);
  const [filterMonth, setFilterMonth] = useState(getDefaultMonth);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deletingPart, setDeletingPart] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  const hasLoadedOnceRef = useRef(false);
  const fetchIdRef = useRef(0);
  const didMountRef = useRef(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const exportHoverBg = useColorModeValue(
    "green.50",
    "rgba(52, 211, 153, 0.1)",
  );
  const { colorMode } = useColorMode();
  const selectBg = useColorModeValue("#f1f5f9", "#1b253b");
  const selectColor = useColorModeValue("#1e293b", "#f1f5f9");
  const selectBorder = useColorModeValue("#cbd5e1", "#2f3b4a");
  const selectHoverBorder = useColorModeValue("#94a3b8", "#4a5a6e");
  const optionBg = useColorModeValue("#ffffff", "#1b253b");
  const optionColor = useColorModeValue("#1e293b", "#f1f5f9");
  const selectArrow = useColorModeValue(
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2360A5FA' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  useEffect(() => {
    if (filterYear && filterMonth) {
      const year = parseInt(filterYear);
      const month = parseInt(filterMonth);
      const pad = (value) => String(value).padStart(2, "0");

      const from = `${year}-${pad(month)}-01`;

      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${pad(month)}-${pad(lastDay)}`;

      setDateFrom(from);
      setDateTo(to);
    } else {
      setDateFrom("");
      setDateTo("");
    }
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterMonth]);

  const fetchExpenses = async (
    targetPage = currentPage,
    searchQuery = search,
    from = dateFrom,
    to = dateTo,
  ) => {
    const fetchId = ++fetchIdRef.current;

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const res = await apiZapchast.All(targetPage, ITEMS_PER_PAGE, {
        search: searchQuery,
        date_from: from || undefined,
        date_to: to || undefined,
      });

      if (fetchIdRef.current !== fetchId) return;

      const responseData = res?.data || res || {};
      const rawData =
        responseData.records ||
        (Array.isArray(responseData)
          ? responseData
          : Array.isArray(res)
            ? res
            : []);
      const paginationData = responseData.pagination || res?.pagination || {};

      const mappedParts = rawData.map((item) => ({
        id: item.id,
        car_id: item.car_id || "",
        part_name: item.part_name || "Nomsiz qism",
        unit: item.unit || "",
        quantity: item.quantity ?? 0,
        payment_type: item.payment_type || "Karta",
        price: item.price ?? 0,
        total_price: item.total_price ?? 0,
        note: item.note || "",
        date: item.date || "",
      }));

      setParts(mappedParts);

      const total =
        paginationData.total_count ||
        responseData.total ||
        res?.total ||
        mappedParts.length;
      const pages =
        paginationData.total_pages ||
        responseData.totalPages ||
        Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

      setTotalItems(total);
      setServerTotalPages(pages);

      if (mappedParts.length === 0 && targetPage > 1 && targetPage > pages) {
        setCurrentPage(pages);
      }
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;
      console.error("Xarajatlarni yuklashda xatolik:", error);
      toast.error("Xarajatlarni yuklashda xatolik yuz berdi");
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
        setIsFetching(false);
        hasLoadedOnceRef.current = true;
      }
    }
  };

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      fetchExpenses(currentPage, search, dateFrom, dateTo);
      return;
    }

    const timer = setTimeout(() => {
      fetchExpenses(currentPage, search, dateFrom, dateTo);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage, dateFrom, dateTo]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Yil tanlanganda state va localStorage'ni birga yangilaymiz
  const handleYearChange = (value) => {
    setFilterYear(value);
    try {
      if (value) {
        localStorage.setItem(LS_YEAR_KEY, value);
      } else {
        localStorage.removeItem(LS_YEAR_KEY);
      }
    } catch (e) {
      // localStorage yozib bo'lmasa jim o'tkazamiz, funksionallikka ta'sir qilmasin
    }
  };

  // Oy tanlanganda state va localStorage'ni birga yangilaymiz
  const handleMonthChange = (value) => {
    setFilterMonth(value);
    try {
      if (value) {
        localStorage.setItem(LS_MONTH_KEY, value);
      } else {
        localStorage.removeItem(LS_MONTH_KEY);
      }
    } catch (e) {
      // localStorage yozib bo'lmasa jim o'tkazamiz
    }
  };

  const clearFilter = () => {
    setFilterYear("");
    setFilterMonth("");
    setCurrentPage(1);
    try {
      localStorage.removeItem(LS_YEAR_KEY);
      localStorage.removeItem(LS_MONTH_KEY);
    } catch (e) {
      // localStorage yozib bo'lmasa jim o'tkazamiz
    }
  };

  useEffect(() => {
    (async () => {
      setCarsLoading(true);
      try {
        const res = await apiCars.All(1, 100);
        const responseData = res?.data?.data || res?.data || {};
        const rawCars =
          responseData.records ||
          (Array.isArray(responseData) ? responseData : []);

       const mappedCars = rawCars.map((car) => ({
  id: car.id,
  name:
    [car.brand, car.model].filter(Boolean).join(" ") ||
    car.model ||
    car.name ||
    "Nomsiz mashina",
  plate_number: car.plate_number || car.gos_raqami || "",
}));

        setCars(mappedCars);
      } catch (error) {
        console.error("Mashinalar ro'yxatini yuklashda xatolik:", error);
        toast.error("Mashinalar ro'yxatini yuklab bo'lmadi");
      } finally {
        setCarsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      total_price: (Number(prev.quantity) || 0) * (Number(prev.price) || 0),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.quantity, form.price]);

  const totalPages = useMemo(
    () => Math.max(1, serverTotalPages),
    [serverTotalPages],
  );
  const safeCurrentPage = useMemo(
    () => Math.min(currentPage, totalPages),
    [currentPage, totalPages],
  );

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

 const carById = useMemo(() => {
  const map = {};

  cars.forEach((car) => {
    map[car.id] = car;
  });

  return map;
}, [cars]);

  const pageTotalSum = useMemo(
    () => parts.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0),
    [parts],
  );

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    onOpen();
  }

  function openEditModal(part) {
    setForm({
      car_id: part.car_id || "",
      part_name: part.part_name,
      unit: part.unit,
      quantity: part.quantity,
      payment_type: part.payment_type || "Karta",
      price: part.price,
      total_price: part.total_price,
      note: part.note,
      date: part.date || new Date().toISOString().slice(0, 10),
    });
    setEditingId(part.id);
    onOpen();
  }

  async function handleSave(e) {
    e?.preventDefault();

    if (!form.car_id) {
      toast.error("Iltimos, mashinani tanlang");
      return;
    }
    if (!form.part_name.trim()) {
      toast.error("Ehtiyot qism nomini kiriting");
      return;
    }
    if (!form.unit.trim()) {
      toast.error("Birlikni kiriting (masalan: litr, dona)");
      return;
    }
    if (!form.date) {
      toast.error("Sanani tanlang");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiZapchast.Update(editingId, form);
        toast.success("Xarajat muvaffaqiyatli yangilandi");
      } else {
        await apiZapchast.Create(form);
        toast.success("Yangi xarajat qo'shildi");
      }
      onClose();
      fetchExpenses(currentPage, search, dateFrom, dateTo);
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(part) {
    setDeletingPart(part);
    onDeleteOpen();
  }

  async function handleDelete() {
    if (!deletingPart) return;
    setIsSubmitting(true);
    try {
      await apiZapchast.Delete(deletingPart.id);
      toast.success("Xarajat o'chirildi");
      onDeleteClose();

      const nextPage =
        parts.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchExpenses(currentPage, search, dateFrom, dateTo);
      }
    } catch (err) {
      console.error(err);
      toast.error("O'chirishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportExcel() {
    if (!dateFrom || !dateTo) {
      toast.error("Excel hisobotini yuklab olish uchun yil va oyni tanlang");
      return;
    }

    setIsExporting(true);
    try {
      const response = await apiZapchast.ExportExcel(dateFrom, dateTo);

      const blob =
        response instanceof Blob
          ? response
          : response?.data instanceof Blob
            ? response.data
            : new Blob([response], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ehtiyot-qismlar_${dateFrom}_${dateTo}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel fayl muvaffaqiyatli yuklab olindi");
    } catch (err) {
      console.error(err);
      toast.error("Excel faylni yuklab olishda xatolik yuz berdi");
    } finally {
      setIsExporting(false);
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
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexWrap="wrap"
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="text" fontWeight="600">
              Ehtiyot qismlar xarajatlari
            </Heading>
            <Text color="textSecondary" fontSize="sm">
              Mashinalar uchun sotib olingan ehtiyot qismlar va ularning
              xarajatlari
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
            Yangi xarajat
          </Button>
        </Flex>

        {/* SEARCH + DATE FILTER (YIL+OY SELECT) + EXCEL + COUNT ROW */}
        <Flex
          justify="space-between"
          align="center"
          gap={3}
          wrap={{ base: "wrap", xl: "nowrap" }}
          mb={5}
        >
          <HStack
            spacing={3}
            flex="1"
            minW={0}
            flexWrap={{ base: "wrap", xl: "nowrap" }}
          >
            <InputGroup maxW="280px" flexShrink={0}>
              <InputLeftElement pointerEvents="none">
                <Search size={17} color="var(--chakra-colors-textSecondary)" />
              </InputLeftElement>
              <Input
                placeholder="Ehtiyot qism nomi bo'yicha qidirish..."
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

            <HStack spacing={2} flexShrink={0} alignItems="center">
              <Box position="relative">
                <Select
                  size="sm"
                  variant="unstyled"
                  placeholder="Yil"
                  value={filterYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  _focus={{ outline: "none" }}
                  style={{ colorScheme: colorMode }}
                  sx={{
                    appearance: "none",
                    borderRadius: "8px",
                    padding: "8px 32px 8px 16px",
                    minWidth: "100px",
                    cursor: "pointer",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "16px",
                    bg: selectBg,
                    color: selectColor,
                    borderColor: selectBorder,
                    backgroundImage: selectArrow,
                    _hover: { borderColor: selectHoverBorder },
                    "&:focus": { borderColor: ACCENT, outline: "none" },
                  }}
                >
                  {yearOptions.map((year) => (
                    <option
                      key={year}
                      value={year}
                      style={{ background: optionBg, color: optionColor }}
                    >
                      {year}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box position="relative">
                <Select
                  size="sm"
                  variant="unstyled"
                  placeholder="Oy"
                  value={filterMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  _focus={{ outline: "none" }}
                  style={{ colorScheme: colorMode }}
                  sx={{
                    appearance: "none",
                    borderRadius: "8px",
                    padding: "8px 32px 8px 16px",
                    minWidth: "100px",
                    cursor: "pointer",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "16px",
                    bg: selectBg,
                    color: selectColor,
                    borderColor: selectBorder,
                    backgroundImage: selectArrow,
                    _hover: { borderColor: selectHoverBorder },
                    "&:focus": { borderColor: ACCENT, outline: "none" },
                  }}
                >
                  {monthOptions.map((month) => (
                    <option
                      key={month}
                      value={month}
                      style={{ background: optionBg, color: optionColor }}
                    >
                      {MONTH_NAMES[month - 1]}
                    </option>
                  ))}
                </Select>
              </Box>

              {(filterYear || filterMonth) && (
                <Tooltip label="Filtrni tozalash">
                  <IconButton
                    icon={<X size={14} />}
                    size="xs"
                    variant="ghost"
                    color="textSecondary"
                    aria-label="Filtrni tozalash"
                    onClick={clearFilter}
                    _hover={{ bg: "blackAlpha.50", color: "text" }}
                  />
                </Tooltip>
              )}
            </HStack>

            <Button
              leftIcon={<Download size={16} />}
              size="sm"
              variant="outline"
              borderRadius="md"
              borderColor="#34d399"
              color="#34d399"
              _hover={{ bg: exportHoverBg }}
              onClick={handleExportExcel}
              isLoading={isExporting}
              loadingText="Yuklanmoqda..."
              fontWeight="600"
              flexShrink={0}
            >
              Export
            </Button>
          </HStack>

          <HStack spacing={3} flexShrink={0}>
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
            <Badge
              fontSize="xs"
              px={3}
              py={1.5}
              borderRadius="lg"
              bg="green.50"
              color="green.600"
              border="1px solid"
              borderColor="green.200"
            >
              Jami summasi: {formatSum(pageTotalSum)} so'm
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
            ) : parts.length === 0 && !isFetching ? (
              <Center py={16}>
                <VStack spacing={3}>
                  <Wrench
                    size={40}
                    opacity={0.3}
                    color="var(--chakra-colors-textSecondary)"
                  />
                  <Text color="textSecondary" fontSize="md">
                    Xarajat topilmadi
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Box
                w="100%"
                overflowX="auto" // <-- FIX: allow horizontal scroll so action column is visible
                opacity={isFetching ? 0.55 : 1}
                pointerEvents={isFetching ? "none" : "auto"}
                transition="opacity 0.15s ease"
              >
                <Table variant="simple" size="md" w="100%" minWidth="900px">
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
                        Ehtiyot qism
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Mashina
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Birlik
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        isNumeric
                      >
                        Miqdori
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        isNumeric
                      >
                        Narxi
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        isNumeric
                      >
                        Umumiy narx
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        To'lov turi
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Sana
                      </Th>
                      <Th
                        textAlign="center"
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        pr={6}
                        minWidth="100px" // ensure action column has space
                      >
                        Amallar
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {parts.map((part) => {
                      const badgeStyle =
                        paymentBadgeStyle[part.payment_type] ||
                        paymentBadgeStyle.Karta;
                      return (
                        <Tr
                          key={part.id}
                          transition="background 0.15s ease"
                          _hover={{ bg: "blackAlpha.50" }}
                        >
                          <Td borderColor="border" pl={6} py={3.5}>
                            <Text fontWeight="600" color="text">
                              {part.part_name}
                            </Text>
                          </Td>

                          <Td
                            borderColor="border"
                            color="textSecondary"
                            fontSize="sm"
                          >
                        {carById[part.car_id] ? (
  <VStack align="start" spacing={0}>
    <Text color="textSecondary" fontSize="sm">
      {carById[part.car_id].name}
    </Text>

    {carById[part.car_id].plate_number && (
      <Text
        color="textSecondary"
        fontSize="xs"
        opacity={0.7}
      >
        {carById[part.car_id].plate_number}
      </Text>
    )}
  </VStack>
) : (
  "—"
)}
                          </Td>

                          <Td
                            borderColor="border"
                            color="textSecondary"
                            fontSize="sm"
                          >
                            {part.unit}
                          </Td>

                          <Td
                            borderColor="border"
                            isNumeric
                            color="textSecondary"
                            fontSize="sm"
                          >
                            {part.quantity}
                          </Td>

                          <Td
                            borderColor="border"
                            isNumeric
                            color="textSecondary"
                            fontSize="sm"
                          >
                            {formatSum(part.price)}
                          </Td>

                          <Td borderColor="border" isNumeric>
                            <Text fontWeight="700" color={ACCENT}>
                              {formatSum(part.total_price)}
                            </Text>
                          </Td>

                          <Td borderColor="border">
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              bg={badgeStyle.bg}
                              color={badgeStyle.color}
                              border="1px solid"
                              borderColor={badgeStyle.border}
                            >
                              {part.payment_type}
                            </Badge>
                          </Td>

                          <Td
                            borderColor="border"
                            color="textSecondary"
                            fontSize="sm"
                          >
                            {part.date}
                          </Td>

                          <Td borderColor="border" pr={6}>
                            <Flex justify="center" gap={1}>
                              <Tooltip label="Tahrirlash">
                                <IconButton
                                  icon={<Pencil size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  color="blue.500" // more visible
                                  borderRadius="md"
                                  _hover={{
                                    bg: "blue.50",
                                    color: "blue.700",
                                  }}
                                  aria-label="Tahrirlash"
                                  onClick={() => openEditModal(part)}
                                />
                              </Tooltip>
                              <Tooltip label="O'chirish">
                                <IconButton
                                  icon={<Trash2 size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  color="red.500"
                                  borderRadius="md"
                                  _hover={{
                                    bg: "red.50",
                                    color: "red.700",
                                  }}
                                  aria-label="O'chirish"
                                  onClick={() => confirmDelete(part)}
                                />
                              </Tooltip>
                            </Flex>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}

            {/* PAGINATION CONTROLS */}
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
            {editingId ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={5}>
            <VStack
              spacing={4}
              as="form"
              id="zapchast-form"
              onSubmit={handleSave}
            >
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Mashina
                  </FormLabel>
                  <Select
                    placeholder={carsLoading ? "Yuklanmoqda..." : "Tanlang"}
                    value={form.car_id}
                    isDisabled={carsLoading}
                    bg="surface"
                    color="text"
                    borderColor="border"
                    focusBorderColor="primary"
                    _hover={{ borderColor: ACCENT }}
                    style={{ colorScheme: colorMode }}
                    onChange={(e) =>
                      setForm({ ...form, car_id: e.target.value })
                    }
                  >
                    {cars.map((car) => (
                      <option
                        key={car.id}
                        value={car.id}
                        style={{ background: optionBg, color: optionColor }}
                      >
                    {car.name}
{car.plate_number && ` — ${car.plate_number}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Ehtiyot qism nomi
                  </FormLabel>
                  <Input
                    placeholder="Masalan: Motor moyi"
                    bg="surface"
                    color="text"
                    borderColor="border"
                    focusBorderColor="primary"
                    _hover={{ borderColor: ACCENT }}
                    value={form.part_name}
                    onChange={(e) =>
                      setForm({ ...form, part_name: e.target.value })
                    }
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Birlik
                  </FormLabel>
                  <Input
                    placeholder="litr, dona"
                    bg="surface"
                    color="text"
                    borderColor="border"
                    focusBorderColor="primary"
                    _hover={{ borderColor: ACCENT }}
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Miqdori
                  </FormLabel>
                  <NumberInput
                    min={0}
                    value={form.quantity}
                    onChange={(v) =>
                      setForm({ ...form, quantity: Number(v) || 0 })
                    }
                  >
                    <NumberInputField
                      bg="surface"
                      color="text"
                      borderColor="border"
                      _hover={{ borderColor: ACCENT }}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Narxi (so'm)
                  </FormLabel>
                  <NumberInput
                    min={0}
                    value={form.price}
                    onChange={(v) =>
                      setForm({ ...form, price: Number(v) || 0 })
                    }
                  >
                    <NumberInputField
                      bg="surface"
                      color="text"
                      borderColor="border"
                      _hover={{ borderColor: ACCENT }}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    To'lov turi
                  </FormLabel>
                  <Select
                    value={form.payment_type}
                    bg="surface"
                    color="text"
                    borderColor="border"
                    focusBorderColor="primary"
                    _hover={{ borderColor: ACCENT }}
                    style={{ colorScheme: colorMode }}
                    onChange={(e) =>
                      setForm({ ...form, payment_type: e.target.value })
                    }
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option
                        key={pt}
                        value={pt}
                        style={{ background: optionBg, color: optionColor }}
                      >
                        {pt}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="100%" alignItems="end">
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Sana
                  </FormLabel>
                  <Input
                    type="date"
                    bg="surface"
                    color="text"
                    borderColor="border"
                    focusBorderColor="primary"
                    _hover={{ borderColor: ACCENT }}
                    style={{ colorScheme: colorMode }}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="medium"
                    color="textSecondary"
                  >
                    Umumiy narx
                  </FormLabel>
                  <Box
                    h="40px"
                    display="flex"
                    alignItems="center"
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="lg"
                    px={3}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="800"
                      color={ACCENT}
                      noOfLines={1}
                    >
                      {formatSum(form.total_price)} so'm
                    </Text>
                  </Box>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color="textSecondary"
                >
                  Izoh
                </FormLabel>
                <Input
                  placeholder="Qo'shimcha izoh"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
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
              form="zapchast-form"
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
              Siz rostdan ham{" "}
              <Text as="span" fontWeight="bold">
                {deletingPart?.part_name}
              </Text>{" "}
              {deletingPart?.car_id && carNameById[deletingPart.car_id] && (
                <>
                  (
                  <Text as="span" fontWeight="bold">
                    {carNameById[deletingPart.car_id]}
                  </Text>
                  ){" "}
                </>
              )}
              xarajatini o'chirmoqchimisiz?
            </Text>

            {deletingPart && (
              <Box
                mt={3}
                bg="blue.50"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="lg"
                px={4}
                py={2.5}
              >
                <Text fontSize="sm" color="textSecondary">
                  Umumiy narx
                </Text>
                <Text fontSize="lg" fontWeight="700" color={ACCENT}>
                  {formatSum(deletingPart.total_price)} so'm
                </Text>
              </Box>
            )}

            <Text mt={3} fontSize="sm" color="textSecondary">
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
