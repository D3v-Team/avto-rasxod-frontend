import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Skeleton,
  useToast,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Center,
  NumberInput,
  NumberInputField,
  Wrap,
  WrapItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  Plus,
  Search,
  Fuel,
  Gauge,
  CalendarDays,
  CalendarOff,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { apiCost } from "../../Services/api/apiCost";

// Backendda yoqilg'i turlari uchun alohida ro'yxat endpointi bo'lmagani sababli
// hozircha shu yerda belgilangan. Haqiqiy loyihada bu ID'lar backenddagi
// fuel jadvalidagi UUID'lar bilan almashtirilishi kerak.
// colorScheme qiymatlari theme/tokens/colors.js dagi palette nomlariga mos:
// "amber" (benzin — yonilg'i rangi) va "secondary" (gaz — moviy-ko'k).
const FUEL_TYPES = [
  { id: "benzin", label: "Benzin", colorScheme: "amber" },
  { id: "gaz", label: "Gaz", colorScheme: "secondary" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Sana" },
  { value: "mileage", label: "Kilometraj" },
  { value: "fuel_expence", label: "Yoqilg'i sarfi" },
  { value: "fuel_price_sum", label: "Summa" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const EMPTY_FORM = {
  date: "",
  fuel_id: FUEL_TYPES[0].id,
  odometer_end: "",
  received_amount: "",
  is_holiday: false,
  note: "",
};

function formatNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("uz-UZ");
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("uz-UZ");
}

function fuelMeta(fuelId) {
  return (
    FUEL_TYPES.find((f) => f.id === fuelId) || {
      label: fuelId,
      colorScheme: "neutral",
    }
  );
}

// Turli backend javoblarida field nomi farq qilishi mumkin bo'lgani uchun
// bir nechta ehtimoliy nomdan birinchi topilganini olamiz.
function pick(obj, keys, fallback = 0) {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Input elementlar uchun umumiy uslub — theme/components/Select.js dagi
// "filledPrimary" uslubiga mos, semantik tokenlar orqali (dark rejimda ham
// avtomatik moslashadi: surface/text/border/primary).
// ---------------------------------------------------------------------------
const inputStyles = {
  bg: "surface",
  color: "text",
  borderWidth: "1.5px",
  borderColor: "border",
  fontWeight: "500",
  borderRadius: "lg",
  transition: "all 0.2s ease",
  _placeholder: { color: "textSecondary" },
  _hover: { borderColor: "primary.400" },
  _focus: {
    borderColor: "primary.500",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
  },
};

function FuelBadge({ fuelId }) {
  const meta = fuelMeta(fuelId);
  return (
    <Badge
      colorScheme={meta.colorScheme}
      borderRadius="md"
      px={2.5}
      py={1}
      fontWeight="bold"
    >
      {meta.label}
    </Badge>
  );
}

function EmptyState({ onReset }) {
  return (
    <Center py={20} flexDirection="column" gap={3}>
      <Center
        bgGradient="linear(to-br, primary.500, secondary.500)"
        borderRadius="full"
        boxSize="64px"
        boxShadow="lg"
        opacity={0.9}
      >
        <Fuel size={26} color="white" />
      </Center>
      <Text color="text" fontWeight="bold" fontSize="lg" mt={2}>
        Hech qanday yozuv topilmadi
      </Text>
      <Text color="textSecondary" fontSize="sm" maxW="360px" textAlign="center">
        Filtrlarni tozalab ko'ring yoki yangi xarajat qo'shib, ro'yxatni
        to'ldiring
      </Text>
      <Button
        size="sm"
        variant="ghost"
        onClick={onReset}
        leftIcon={<RefreshCw size={14} />}
        mt={1}
      >
        Filtrlarni tozalash
      </Button>
    </Center>
  );
}

// ---------------------------------------------------------------------------
// Filtr paneli
// ---------------------------------------------------------------------------

function FilterBar({ filters, onChange, onReset }) {
  const isStacked = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex
      direction={isStacked ? "column" : "row"}
      gap={3}
      wrap="wrap"
      align="center"
    >
      <InputGroup maxW={{ base: "100%", lg: "260px" }}>
        <InputLeftElement pointerEvents="none">
          <Search size={16} color="var(--chakra-colors-textSecondary)" />
        </InputLeftElement>
        <Input
          placeholder="Mashina yoki raqam bo'yicha qidirish"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          {...inputStyles}
        />
      </InputGroup>

      <Input
        type="date"
        value={filters.date_from}
        onChange={(e) => onChange({ date_from: e.target.value })}
        maxW={{ base: "100%", lg: "160px" }}
        {...inputStyles}
      />
      <Input
        type="date"
        value={filters.date_to}
        onChange={(e) => onChange({ date_to: e.target.value })}
        maxW={{ base: "100%", lg: "160px" }}
        {...inputStyles}
      />

      <Select
        value={filters.fuel_id}
        onChange={(e) => onChange({ fuel_id: e.target.value })}
        maxW={{ base: "100%", lg: "150px" }}
        borderRadius="lg"
      >
        <option value="">Barcha turlar</option>
        {FUEL_TYPES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </Select>

      <Select
        value={filters.is_holiday}
        onChange={(e) => onChange({ is_holiday: e.target.value })}
        maxW={{ base: "100%", lg: "150px" }}
        borderRadius="lg"
      >
        <option value="">Barcha kunlar</option>
        <option value="false">Ish kuni</option>
        <option value="true">Dam olish</option>
      </Select>

      <HStack maxW={{ base: "100%", lg: "auto" }}>
        <Select
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value })}
          borderRadius="lg"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <IconButton
          aria-label="Tartibni almashtirish"
          icon={<ArrowUpDown size={16} />}
          variant="outlinePrimary"
          borderRadius="lg"
          onClick={() =>
            onChange({
              sortOrder: filters.sortOrder === "ASC" ? "DESC" : "ASC",
            })
          }
        />
      </HStack>

      <Button
        variant="ghost"
        leftIcon={<X size={16} />}
        onClick={onReset}
        ml={isStacked ? 0 : "auto"}
      >
        Tozalash
      </Button>
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Jadval
// ---------------------------------------------------------------------------

function ExpenseTable({ items, loading, onEdit, onDelete, onResetFilters }) {
  if (loading) {
    return (
      <VStack p={6} align="stretch" spacing={3}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height="46px" borderRadius="lg" />
        ))}
      </VStack>
    );
  }

  if (!items.length) {
    return <EmptyState onReset={onResetFilters} />;
  }

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead bg="bg">
          <Tr>
            <Th color="textSecondary" borderColor="border" py={4}>
              Sana
            </Th>
            <Th color="textSecondary" borderColor="border">
              Yoqilg'i
            </Th>
            <Th color="textSecondary" borderColor="border" isNumeric>
              Spidometr
            </Th>
            <Th color="textSecondary" borderColor="border" isNumeric>
              Km
            </Th>
            <Th color="textSecondary" borderColor="border" isNumeric>
              Olingan
            </Th>
            <Th color="textSecondary" borderColor="border" isNumeric>
              Sarflangan
            </Th>
            <Th color="textSecondary" borderColor="border" isNumeric>
              Summa
            </Th>
            <Th color="textSecondary" borderColor="border">
              Holat
            </Th>
            <Th borderColor="border" w="1%" />
          </Tr>
        </Thead>
        <Tbody>
          {items.map((row, idx) => (
            <Tr
              key={row.id}
              bg={idx % 2 === 1 ? "bg" : "surface"}
              _hover={{ bg: "primaryBg" }}
              transition="background 0.15s ease"
            >
              <Td
                fontWeight="semibold"
                color="text"
                borderColor="border"
                py={3.5}
              >
                {formatDate(row.date)}
              </Td>
              <Td borderColor="border">
                <FuelBadge fuelId={row.fuel_id} />
              </Td>
              <Td isNumeric color="textSecondary" borderColor="border">
                {formatNumber(row.odometer_end)} km
              </Td>
              <Td isNumeric color="textSecondary" borderColor="border">
                {formatNumber(pick(row, ["mileage", "km"]))}
              </Td>
              <Td isNumeric color="textSecondary" borderColor="border">
                {formatNumber(row.received_amount)} l
              </Td>
              <Td isNumeric color="textSecondary" borderColor="border">
                {formatNumber(pick(row, ["fuel_expence", "fuel_expense"]))} l
              </Td>
              <Td isNumeric fontWeight="bold" color="text" borderColor="border">
                {formatNumber(pick(row, ["fuel_price_sum", "sum"]))} so'm
              </Td>
              <Td borderColor="border">
                {row.is_holiday ? (
                  <Badge
                    colorScheme="accent"
                    variant="subtle"
                    borderRadius="md"
                  >
                    Dam olish
                  </Badge>
                ) : (
                  <Text color="textSecondary" fontSize="sm">
                    —
                  </Text>
                )}
              </Td>
              <Td borderColor="border">
                <Menu placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    icon={<MoreVertical size={16} />}
                    variant="ghost"
                    size="sm"
                    borderRadius="lg"
                    aria-label="Amallar"
                  />
                  <MenuList
                    minW="150px"
                    bg="surface"
                    borderColor="border"
                    boxShadow="lg"
                  >
                    <MenuItem
                      icon={<Pencil size={14} />}
                      onClick={() => onEdit(row)}
                      bg="surface"
                      color="text"
                      _hover={{ bg: "primaryBg" }}
                    >
                      Tahrirlash
                    </MenuItem>
                    <MenuItem
                      icon={<Trash2 size={14} />}
                      color="danger"
                      onClick={() => onDelete(row)}
                      bg="surface"
                      _hover={{ bg: "dangerBg" }}
                    >
                      O'chirish
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// Qo'shish / tahrirlash formasi (Drawer)
// ---------------------------------------------------------------------------

function ExpenseFormDrawer({
  isOpen,
  onClose,
  initialData,
  isEditing,
  onSubmit,
  isSaving,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isValid =
    form.date &&
    form.fuel_id &&
    form.odometer_end !== "" &&
    form.received_amount !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      ...form,
      odometer_end: Number(form.odometer_end),
      received_amount: Number(form.received_amount),
    });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg="surface" color="text">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor="border">
          {isEditing ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish"}
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch" py={2}>
            <FormControl isRequired isDisabled={isEditing}>
              <FormLabel fontSize="sm" color="textSecondary">
                Sana
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <CalendarDays
                    size={16}
                    color="var(--chakra-colors-textSecondary)"
                  />
                </InputLeftElement>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => update({ date: e.target.value })}
                  {...inputStyles}
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired isDisabled={isEditing}>
              <FormLabel fontSize="sm" color="textSecondary">
                Yoqilg'i turi
              </FormLabel>
              <Wrap>
                {FUEL_TYPES.map((f) => {
                  const active = form.fuel_id === f.id;
                  return (
                    <WrapItem key={f.id}>
                      <Button
                        size="sm"
                        leftIcon={<Fuel size={14} />}
                        variant={active ? "solidPrimary" : "outlinePrimary"}
                        onClick={() => update({ fuel_id: f.id })}
                        isDisabled={isEditing}
                        borderRadius="lg"
                      >
                        {f.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" color="textSecondary">
                Spidometr (kun oxiri, km)
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Gauge size={16} color="var(--chakra-colors-textSecondary)" />
                </InputLeftElement>
                <NumberInput
                  value={form.odometer_end}
                  onChange={(val) => update({ odometer_end: val })}
                  min={0}
                  w="100%"
                >
                  <NumberInputField
                    pl={10}
                    placeholder="masalan: 257289"
                    {...inputStyles}
                  />
                </NumberInput>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" color="textSecondary">
                Olingan yoqilg'i (litr)
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Fuel size={16} color="var(--chakra-colors-textSecondary)" />
                </InputLeftElement>
                <NumberInput
                  value={form.received_amount}
                  onChange={(val) => update({ received_amount: val })}
                  min={0}
                  w="100%"
                >
                  <NumberInputField
                    pl={10}
                    placeholder="masalan: 15"
                    {...inputStyles}
                  />
                </NumberInput>
              </InputGroup>
            </FormControl>

            <FormControl
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bg="bg"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <FormLabel
                fontSize="sm"
                mb={0}
                display="flex"
                alignItems="center"
                gap={2}
                color="textSecondary"
              >
                <CalendarOff
                  size={16}
                  color="var(--chakra-colors-textSecondary)"
                />
                Dam olish kuni
              </FormLabel>
              <Switch
                isChecked={form.is_holiday}
                onChange={(e) => update({ is_holiday: e.target.checked })}
                colorScheme="accent"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" color="textSecondary">
                Izoh
              </FormLabel>
              <Textarea
                value={form.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Ixtiyoriy izoh..."
                resize="vertical"
                rows={3}
                {...inputStyles}
              />
            </FormControl>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor="border" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            variant="solidPrimary"
            onClick={handleSubmit}
            isDisabled={!isValid}
            isLoading={isSaving}
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// O'chirishni tasdiqlash oynasi
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  target,
}) {
  const cancelRef = React.useRef();

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="surface" color="text">
          <AlertDialogHeader display="flex" alignItems="center" gap={2}>
            <AlertTriangle size={18} color="var(--chakra-colors-danger)" />
            Yozuvni o'chirish
          </AlertDialogHeader>
          <AlertDialogBody color="textSecondary">
            {target ? formatDate(target.date) : ""} sanadagi yozuvni
            o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button ref={cancelRef} variant="ghost" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              variant="solidDanger"
              onClick={onConfirm}
              isLoading={isDeleting}
            >
              O'chirish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Asosiy sahifa
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS = {
  search: "",
  fuel_id: "",
  date_from: "",
  date_to: "",
  is_holiday: "",
  sortBy: "date",
  sortOrder: "DESC",
};

function CostPage() {
  // Sahifa "/cars/:carId/expenses" kabi marshrutga bog'langan deb qabul qilingan.
  const { carId } = useParams();
  const toast = useToast();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editingExpense, setEditingExpense] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formDrawer = useDisclosure();
  const deleteDialog = useDisclosure();

  const updateFilters = (patch) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  // --- Ro'yxatni yuklash -----------------------------------------------
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCost.All(page, limit, {
        car_id: carId,
        search: filters.search,
        fuel_id: filters.fuel_id,
        date_from: filters.date_from,
        date_to: filters.date_to,
        is_holiday: filters.is_holiday,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setExpenses(pick(data, ["items", "data", "results"], []) || []);
      setTotal(pick(data, ["total", "count"], 0));
    } catch (err) {
      toast({
        title: "Ro'yxatni yuklab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, page, limit, filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // --- CRUD amallar ------------------------------------------------------
  const openCreateForm = () => {
    setEditingExpense(null);
    formDrawer.onOpen();
  };

  const openEditForm = (row) => {
    setEditingExpense({
      date: row.date?.slice(0, 10) || "",
      fuel_id: row.fuel_id,
      odometer_end: row.odometer_end,
      received_amount: row.received_amount,
      is_holiday: !!row.is_holiday,
      note: row.note || "",
      id: row.id,
    });
    formDrawer.onOpen();
  };

  const handleSubmitForm = async (form) => {
    setIsSaving(true);
    try {
      if (editingExpense?.id) {
        await apiCost.Update(editingExpense.id, {
          odometer_end: form.odometer_end,
          received_amount: form.received_amount,
          is_holiday: form.is_holiday,
          note: form.note,
        });
        toast({ title: "Yozuv yangilandi", status: "success", duration: 2500 });
      } else {
        await apiCost.Create({
          car_id: carId,
          fuel_id: form.fuel_id,
          date: form.date,
          odometer_end: form.odometer_end,
          received_amount: form.received_amount,
          is_holiday: form.is_holiday,
          note: form.note,
        });
        toast({
          title: "Yangi xarajat qo'shildi",
          status: "success",
          duration: 2500,
        });
      }
      formDrawer.onClose();
      loadExpenses();
    } catch (err) {
      toast({
        title: "Saqlab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiCost.Delete(deleteTarget.id);
      toast({ title: "Yozuv o'chirildi", status: "success", duration: 2500 });
      deleteDialog.onClose();
      loadExpenses();
    } catch (err) {
      toast({
        title: "O'chirib bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Box
      bg="bg"
      minH="100vh"
      w="100%"
      px={{ base: 4, md: 8, xl: 12 }}
      py={{ base: 4, md: 8 }}
    >
      {/* Sarlavha — endi karta ichida emas, sahifaning o'zida, kengroq va bo'shliqni to'ldiradi */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap={4}
        wrap="wrap"
        mb={6}
      >
        <Box>
          <Heading
            size="xl"
            color="text"
            fontWeight="extrabold"
            letterSpacing="tight"
          >
            Xarajatlar
          </Heading>
          <Text color="textSecondary" fontSize="md" mt={1}>
            Mashinaning kunlik yoqilg'i xarajatlari va sarf statistikasi
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={18} />}
          variant="solidPrimary"
          onClick={openCreateForm}
          size="lg"
          borderRadius="xl"
          boxShadow="md"
        >
          Xarajat qo'shish
        </Button>
      </Flex>

      {/* Filtrlar — endi alohida, jadval kartasidan tashqarida, tepada */}
      <Box
        bg="surface"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        boxShadow="md"
        px={{ base: 5, md: 8 }}
        py={5}
        mb={6}
        w="100%"
      >
        <FilterBar
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
        />
      </Box>

      {/* Asosiy karta: jadval, butun kenglikda */}
      <Box
        bg="surface"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        boxShadow="md"
        overflow="hidden"
        w="100%"
      >
        {/* Jadval */}
        <Box>
          <ExpenseTable
            items={expenses}
            loading={loading}
            onEdit={openEditForm}
            onDelete={askDelete}
            onResetFilters={resetFilters}
          />

          {!loading && expenses.length > 0 && (
            <>
              <Divider borderColor="border" />
              <Flex
                justify="space-between"
                align="center"
                px={{ base: 5, md: 8 }}
                py={4}
                wrap="wrap"
                gap={3}
              >
                <HStack fontSize="sm" color="textSecondary">
                  <Text>Jami: {formatNumber(total)} ta yozuv</Text>
                  <Select
                    size="sm"
                    w="110px"
                    borderRadius="lg"
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(Number(e.target.value));
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} / sahifa
                      </option>
                    ))}
                  </Select>
                </HStack>

                <HStack>
                  <IconButton
                    aria-label="Oldingi sahifa"
                    icon={<ChevronLeft size={16} />}
                    size="sm"
                    variant="outlinePrimary"
                    borderRadius="lg"
                    isDisabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  <Text
                    fontSize="sm"
                    color="textSecondary"
                    minW="70px"
                    textAlign="center"
                    fontWeight="medium"
                  >
                    {page} / {totalPages}
                  </Text>
                  <IconButton
                    aria-label="Keyingi sahifa"
                    icon={<ChevronRight size={16} />}
                    size="sm"
                    variant="outlinePrimary"
                    borderRadius="lg"
                    isDisabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </HStack>
              </Flex>
            </>
          )}
        </Box>
      </Box>

      {/* Forma va dialog oynalari */}
      <ExpenseFormDrawer
        isOpen={formDrawer.isOpen}
        onClose={formDrawer.onClose}
        initialData={editingExpense}
        isEditing={!!editingExpense?.id}
        onSubmit={handleSubmitForm}
        isSaving={isSaving}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        target={deleteTarget}
      />
    </Box>
  );
}

export default CostPage;
