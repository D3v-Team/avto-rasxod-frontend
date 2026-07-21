import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Grid,
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
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  Plus,
  Fuel,
  Gauge,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  MoreVertical,
  AlertTriangle,
  Car,
} from "lucide-react";
import { apiCost } from "../../Services/api/apiCost";
import { apiFuel } from "../../Services/api/Fuels";
import { apiCars } from "../../Services/api/Cars";

const SORT_OPTIONS = [
  { value: "date", label: "Sana" },
  { value: "mileage", label: "Kilometraj" },
  { value: "fuel_expence", label: "Yoqilg'i sarfi" },
  { value: "fuel_price_sum", label: "Summa" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const EMPTY_EDIT_FORM = {
  date: "",
  fuel_id: "",
  odometer_end: "",
  received_amount: "",
  is_holiday: false,
  note: "",
};

const EMPTY_NEW_ROW = {
  date: "",
  fuel_id: "",
  odometer_end: "",
  received_amount: "",
  is_holiday: false,
};

// Backend fuel obyektida colorScheme kelmagani sababli, nomiga qarab
// theme/tokens/colors.js dagi palette nomlaridan mos rangni tanlaymiz.
// Nomi tanish bo'lmagan yoqilg'ilar uchun navbat bilan palette'dan olinadi.
const FUEL_COLOR_MAP = {
  benzin: "amber",
  gaz: "secondary",
  gas: "secondary",
  dizel: "neutral",
  diesel: "neutral",
  propan: "success",
  metan: "primary",
};
const FUEL_COLOR_PALETTE = [
  "amber",
  "secondary",
  "accent",
  "success",
  "primary",
  "neutral",
];

function getFuelColorScheme(rawName, index) {
  const key = (rawName || "").toString().trim().toLowerCase();
  if (FUEL_COLOR_MAP[key]) return FUEL_COLOR_MAP[key];
  return FUEL_COLOR_PALETTE[index % FUEL_COLOR_PALETTE.length];
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

// Backenddan kelgan javob massiv shaklida ham (to'g'ridan-to'g'ri array),
// ham obyekt ichida (items/data/results) kelishi mumkin — ikkalasini ham
// qo'llab-quvvatlaymiz.
function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  const nested = pick(payload, ["items", "data", "results"], null);
  if (Array.isArray(nested)) return nested;
  return [];
}

// Backenddan kelgan xom fuel obyektini { id, label, colorScheme } shakliga keltiramiz.
function normalizeFuelType(raw, index) {
  const id = pick(raw, ["id", "_id", "uuid"], null);
  const label = pick(raw, ["name", "label", "title"], id ?? "Noma'lum");
  return {
    id,
    label: String(label),
    colorScheme: getFuelColorScheme(label, index),
  };
}

// Backenddan kelgan xom car obyektini { id, label } shakliga keltiramiz.
// Mashina nomi uchun turli ehtimoliy fieldlarni sinab ko'ramiz va
// davlat raqami mavjud bo'lsa qavs ichida qo'shamiz.
function normalizeCar(raw) {
  const id = pick(raw, ["id", "_id", "uuid"], null);
  const name = pick(raw, ["name", "model", "car_name", "title", "brand"], null);
  const plate = pick(
    raw,
    ["plate_number", "gov_number", "number", "plate"],
    null,
  );
  const label = [name, plate].filter(Boolean).join(" — ") || id || "Noma'lum";
  return { id, label: String(label) };
}

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

const inlineInputStyles = {
  ...inputStyles,
  borderWidth: "1px",
};

// Yangi yozuv qo'shish paneli uchun — "pill" ko'rinishidagi, to'liq
// yumaloqlangan (borderRadius="full") to'q fon uslubi.
const pillInputStyles = {
  bg: "bg",
  color: "text",
  borderWidth: "1.5px",
  borderColor: "whiteAlpha.200",
  fontWeight: "600",
  borderRadius: "full",
  h: "44px",
  transition: "all 0.2s ease",
  _placeholder: { color: "textSecondary" },
  _hover: { borderColor: "primary.400" },
  _focus: {
    borderColor: "primary.400",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
  },
};

function FuelBadge({ fuelId, fuelTypesById }) {
  const meta = fuelTypesById[fuelId] || {
    label: fuelId || "—",
    colorScheme: "neutral",
  };
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

function EmptyState() {
  return (
    <Center py={16} flexDirection="column" gap={3}>
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
        Yuqoridagi panelga ma'lumot kiritib, yangi xarajat qo'shing yoki
        filtrlarni tekshiring
      </Text>
    </Center>
  );
}

function NoCarState() {
  return (
    <Center py={16} flexDirection="column" gap={3}>
      <Center
        bgGradient="linear(to-br, primary.500, secondary.500)"
        borderRadius="full"
        boxSize="64px"
        boxShadow="lg"
        opacity={0.9}
      >
        <Car size={26} color="white" />
      </Center>
      <Text color="text" fontWeight="bold" fontSize="lg" mt={2}>
        Avval mashinani tanlang
      </Text>
      <Text color="textSecondary" fontSize="sm" maxW="360px" textAlign="center">
        Xarajatlarni ko'rish va qo'shish uchun yuqoridagi ro'yxatdan mashinani
        tanlang
      </Text>
    </Center>
  );
}

// ---------------------------------------------------------------------------
// Mashina tanlash paneli
// ---------------------------------------------------------------------------

function CarSelector({ cars, carsLoading, selectedCarId, onChange }) {
  return (
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
      <FormControl>
        <FormLabel fontSize="sm" color="textSecondary">
          Mashina
        </FormLabel>
        {carsLoading ? (
          <Skeleton
            h="40px"
            w={{ base: "100%", md: "320px" }}
            borderRadius="lg"
          />
        ) : (
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Car size={16} color="var(--chakra-colors-textSecondary)" />
            </InputLeftElement>
            <Select
              value={selectedCarId}
              onChange={(e) => onChange(e.target.value)}
              borderRadius="lg"
              pl={9}
              {...inputStyles}
            >
              <option value="">Mashinani tanlang</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </InputGroup>
        )}
      </FormControl>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Filtr paneli (qidiruv va "dam olish" filtri olib tashlangan)
// ---------------------------------------------------------------------------

function FilterBar({
  filters,
  onChange,
  onReset,
  fuelTypes,
  fuelTypesLoading,
}) {
  const isStacked = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex
      direction={isStacked ? "column" : "row"}
      gap={3}
      wrap="wrap"
      align="center"
    >
      <Input
        type="date"
        value={filters.date_from}
        onChange={(e) => onChange({ date_from: e.target.value })}
        maxW={{ base: "100%", lg: "170px" }}
        {...inputStyles}
      />
      <Input
        type="date"
        value={filters.date_to}
        onChange={(e) => onChange({ date_to: e.target.value })}
        maxW={{ base: "100%", lg: "170px" }}
        {...inputStyles}
      />

      {fuelTypesLoading ? (
        <Skeleton
          h="40px"
          w={{ base: "100%", lg: "150px" }}
          borderRadius="lg"
        />
      ) : (
        <Select
          value={filters.fuel_id}
          onChange={(e) => onChange({ fuel_id: e.target.value })}
          maxW={{ base: "100%", lg: "150px" }}
          borderRadius="lg"
          {...inputStyles}
        >
          <option value="">Barcha turlar</option>
          {fuelTypes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </Select>
      )}

      <HStack maxW={{ base: "100%", lg: "auto" }}>
        {/* <Select
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value })}
          borderRadius="lg"
          {...inputStyles}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select> */}
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
// Yangi xarajat qo'shish paneli — endi asosiy jadvaldan ALOHIDA, uning
// TEPASIDA joylashgan mustaqil karta. Ustunlar sarlavhasi + pastida
// pill-shaklidagi inputlar bo'lgan qator (rasm-2 uslubiga mos).
// ---------------------------------------------------------------------------

const NEW_ROW_GRID_COLUMNS = {
  base: "1fr",
  lg: "1.2fr 1.1fr 1.2fr 0.6fr 1.2fr 0.6fr 0.6fr 1.1fr 56px",
};

function NewExpenseCard({
  newRow,
  onChange,
  onAdd,
  isSaving,
  fuelTypes,
  fuelTypesLoading,
  disabled,
}) {
  const isStacked = useBreakpointValue({ base: true, lg: false });

  const isValid =
    !disabled &&
    newRow.date &&
    newRow.fuel_id &&
    newRow.odometer_end !== "" &&
    newRow.received_amount !== "";

  const columnLabels = [
    "Sana",
    "Yoqilg'i",
    "Spidometr",
    "Km",
    "Olingan",
    "Sarflangan",
    "Summa",
    "Holat",
  ];

  return (
    <Box
      bg="surfaceRaised"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border"
      boxShadow="lg"
      overflow="hidden"
      mb={6}
      w="100%"
      opacity={disabled ? 0.55 : 1}
      pointerEvents={disabled ? "none" : "auto"}
    >
      {/* Tepadagi urg'u chizig'i */}
      <Box h="4px" bgGradient="linear(to-r, primary.500, secondary.500)" />

      <Box px={{ base: 5, md: 7 }} pt={5} pb={{ base: 5, md: 6 }}>
        <HStack mb={4} spacing={2}>
          {/* <Center
            bg="primaryBg"
            borderRadius="lg"
            boxSize="28px"
            color="primary.400"
          >
            <Plus size={16} />
          </Center>
          <Text fontWeight="bold" color="text" fontSize="md">
            Yangi xarajat qo'shish
          </Text> */}
        </HStack>

        {/* Ustun sarlavhalari — faqat keng ekranda ko'rinadi */}
        {!isStacked && (
          <Grid templateColumns={NEW_ROW_GRID_COLUMNS} gap={3} px={1} mb={2}>
            {columnLabels.map((label) => (
              <Text
                key={label}
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="wider"
                textTransform="uppercase"
                color="textSecondary"
              >
                {label}
              </Text>
            ))}
            <Box />
          </Grid>
        )}

        {/* Kiritish qatori */}
        <Grid
          templateColumns={NEW_ROW_GRID_COLUMNS}
          gap={3}
          align="center"
          bg="primaryBg"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="primary.500/20"
          px={{ base: 3, lg: 3 }}
          py={{ base: 4, lg: 3 }}
        >
          {isStacked && (
            <FormLabel fontSize="xs" color="textSecondary" mb={0}>
              Sana
            </FormLabel>
          )}
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none" h="44px">
              <CalendarDays
                size={16}
                color="var(--chakra-colors-textSecondary)"
              />
            </InputLeftElement>
            <Input
              type="date"
              pl={9}
              value={newRow.date}
              onChange={(e) => onChange({ date: e.target.value })}
              isDisabled={disabled}
              {...pillInputStyles}
            />
          </InputGroup>

          {isStacked && (
            <FormLabel fontSize="xs" color="textSecondary" mb={0}>
              Yoqilg'i
            </FormLabel>
          )}
          {fuelTypesLoading ? (
            <Skeleton h="44px" borderRadius="full" />
          ) : (
            <Select
              value={newRow.fuel_id}
              onChange={(e) => onChange({ fuel_id: e.target.value })}
              isDisabled={disabled}
              {...pillInputStyles}
            >
              {fuelTypes.length === 0 && <option value="">—</option>}
              {fuelTypes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          )}

          {isStacked && (
            <FormLabel fontSize="xs" color="textSecondary" mb={0}>
              Spidometr
            </FormLabel>
          )}
          <NumberInput
            min={0}
            value={newRow.odometer_end}
            onChange={(val) => onChange({ odometer_end: val })}
            isDisabled={disabled}
          >
            <NumberInputField
              placeholder="km"
              textAlign={isStacked ? "left" : "right"}
              {...pillInputStyles}
            />
          </NumberInput>

          {!isStacked && (
            <Center>
              <Text color="textSecondary" fontSize="sm">
                —
              </Text>
            </Center>
          )}

          {isStacked && (
            <FormLabel fontSize="xs" color="textSecondary" mb={0}>
              Olingan
            </FormLabel>
          )}
          <NumberInput
            min={0}
            value={newRow.received_amount}
            onChange={(val) => onChange({ received_amount: val })}
            isDisabled={disabled}
          >
            <NumberInputField
              placeholder="litr"
              textAlign={isStacked ? "left" : "right"}
              {...pillInputStyles}
            />
          </NumberInput>

          {!isStacked && (
            <Center>
              <Text color="textSecondary" fontSize="sm">
                —
              </Text>
            </Center>
          )}
          {!isStacked && (
            <Center>
              <Text color="textSecondary" fontSize="sm">
                —
              </Text>
            </Center>
          )}

          <HStack
            spacing={2}
            justify={isStacked ? "flex-start" : "center"}
            bg="bg"
            borderRadius="full"
            borderWidth="1.5px"
            borderColor="whiteAlpha.200"
            h="44px"
            px={4}
          >
            <Switch
              size="sm"
              isChecked={newRow.is_holiday}
              onChange={(e) => onChange({ is_holiday: e.target.checked })}
              colorScheme="accent"
              isDisabled={disabled}
            />
            <Text fontSize="xs" color="textSecondary" whiteSpace="nowrap">
              Dam olish
            </Text>
          </HStack>

          <Center>
            <IconButton
              aria-label="Qo'shish"
              icon={<Plus size={18} />}
              variant="solidPrimary"
              borderRadius="full"
              boxSize="44px"
              minW="44px"
              onClick={onAdd}
              isDisabled={disabled || !isValid}
              isLoading={isSaving}
            />
          </Center>
        </Grid>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Jadval
// ---------------------------------------------------------------------------

function ExpenseTable({
  items,
  loading,
  onEdit,
  onDelete,
  fuelTypesById,
  noCarSelected,
}) {
  if (noCarSelected) {
    return <NoCarState />;
  }

  const header = (
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
  );

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        {header}
        <Tbody>
          {loading &&
            [...Array(4)].map((_, i) => (
              <Tr key={`skeleton-${i}`}>
                <Td colSpan={9} borderColor="border" py={2}>
                  <Skeleton height="32px" borderRadius="lg" />
                </Td>
              </Tr>
            ))}

          {!loading && items.length === 0 && (
            <Tr>
              <Td colSpan={9} border="none" p={0}>
                <EmptyState />
              </Td>
            </Tr>
          )}

          {!loading &&
            items.map((row, idx) => (
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
                  <FuelBadge
                    fuelId={row.fuel_id}
                    fuelTypesById={fuelTypesById}
                  />
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
                <Td
                  isNumeric
                  fontWeight="bold"
                  color="text"
                  borderColor="border"
                >
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
// Tahrirlash formasi (Drawer) — faqat mavjud yozuvni tahrirlash uchun
// ---------------------------------------------------------------------------

function EditExpenseDrawer({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
  fuelTypesById,
}) {
  const [form, setForm] = useState(EMPTY_EDIT_FORM);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || EMPTY_EDIT_FORM);
    }
  }, [isOpen, initialData]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isValid = form.odometer_end !== "" && form.received_amount !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      ...form,
      odometer_end: Number(form.odometer_end),
      received_amount: Number(form.received_amount),
    });
  };

  const fuelMeta = fuelTypesById[form.fuel_id];

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg="surface" color="text">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor="border">
          Xarajatni tahrirlash
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch" py={2}>
            <FormControl isDisabled>
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
                <Input value={form.date} isDisabled {...inputStyles} />
              </InputGroup>
            </FormControl>

            <FormControl isDisabled>
              <FormLabel fontSize="sm" color="textSecondary">
                Yoqilg'i turi
              </FormLabel>
              <Badge
                colorScheme={fuelMeta?.colorScheme || "neutral"}
                borderRadius="md"
                px={2.5}
                py={1}
                fontWeight="bold"
              >
                {fuelMeta?.label || form.fuel_id || "—"}
              </Badge>
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
              <FormLabel fontSize="sm" mb={0} color="textSecondary">
                Dam olish kuni
              </FormLabel>
              <Switch
                isChecked={form.is_holiday}
                onChange={(e) => update({ is_holiday: e.target.checked })}
                colorScheme="accent"
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
  fuel_id: "",
  date_from: "",
  date_to: "",
  sortBy: "date",
  sortOrder: "DESC",
};

function CostPage() {
  const toast = useToast();

  // --- Mashinalar ro'yxati (backenddan, /cars) ---------------------------
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState("");

  const loadCars = useCallback(async () => {
    setCarsLoading(true);
    try {
      const response = await apiCars.All(
        1,
        100,
        "",
        true,
        "",
        "",
        "name",
        "ASC",
      );
      const raw = extractList(response?.data);
      const normalized = raw.map(normalizeCar);
      setCars(normalized);
      if (normalized.length === 1) {
        // Faqat bitta mashina bo'lsa, avtomatik tanlaymiz
        setSelectedCarId(normalized[0].id);
      }
    } catch (err) {
      toast({
        title: "Mashinalar ro'yxatini yuklab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- Yoqilg'i turlari (backenddan, /fuels) -----------------------------
  const [fuelTypes, setFuelTypes] = useState([]);
  const [fuelTypesLoading, setFuelTypesLoading] = useState(true);

  const fuelTypesById = useMemo(() => {
    const map = {};
    fuelTypes.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [fuelTypes]);

  const loadFuelTypes = useCallback(async () => {
    setFuelTypesLoading(true);
    try {
      const response = await apiFuel.All(1, 100, "", "name", "ASC");
      const raw = extractList(response?.data);
      setFuelTypes(raw.map(normalizeFuelType));
    } catch (err) {
      toast({
        title: "Yoqilg'i turlarini yuklab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
      setFuelTypes([]);
    } finally {
      setFuelTypesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFuelTypes();
  }, [loadFuelTypes]);

  // --- Yangi qo'shish paneli -----------------------------------------------
  const [newRow, setNewRow] = useState(EMPTY_NEW_ROW);
  const [isSavingRow, setIsSavingRow] = useState(false);

  useEffect(() => {
    // Yoqilg'i turlari yuklangach, standart holatda birinchisini tanlaymiz
    if (fuelTypes.length && !newRow.fuel_id) {
      setNewRow((prev) => ({ ...prev, fuel_id: fuelTypes[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelTypes]);

  const updateNewRow = (patch) => setNewRow((prev) => ({ ...prev, ...patch }));

  const [editingExpense, setEditingExpense] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editDrawer = useDisclosure();
  const deleteDialog = useDisclosure();

  const updateFilters = (patch) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  const handleCarChange = (id) => {
    setSelectedCarId(id);
    setPage(1);
    setExpenses([]);
    setTotal(0);
  };

  // --- Ro'yxatni yuklash ---------------------------------------------------
  const loadExpenses = useCallback(async () => {
    if (!selectedCarId) {
      setExpenses([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await apiCost.All(page, limit, {
        car_id: selectedCarId,
        fuel_id: filters.fuel_id,
        date_from: filters.date_from,
        date_to: filters.date_to,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setExpenses(extractList(data));
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
  }, [selectedCarId, page, limit, filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // --- Yangi yozuv qo'shish (endi alohida panel orqali) --------------------
  const handleAddRow = async () => {
    if (!selectedCarId) {
      toast({
        title: "Avval mashinani tanlang",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (
      !newRow.date ||
      !newRow.fuel_id ||
      newRow.odometer_end === "" ||
      newRow.received_amount === ""
    ) {
      toast({
        title: "Barcha maydonlarni to'ldiring",
        description: "Sana, yoqilg'i turi, spidometr va olingan miqdor kerak",
        status: "warning",
        duration: 3500,
      });
      return;
    }
    setIsSavingRow(true);
    try {
      await apiCost.Create({
        car_id: selectedCarId,
        fuel_id: newRow.fuel_id,
        date: newRow.date,
        odometer_end: Number(newRow.odometer_end),
        received_amount: Number(newRow.received_amount),
        is_holiday: newRow.is_holiday,
        note: "",
      });
      toast({
        title: "Yangi xarajat qo'shildi",
        status: "success",
        duration: 2500,
      });
      setNewRow({
        ...EMPTY_NEW_ROW,
        fuel_id: newRow.fuel_id, // oldingi tanlangan yoqilg'i turi saqlanadi
      });
      loadExpenses();
    } catch (err) {
      toast({
        title: "Saqlab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSavingRow(false);
    }
  };

  // --- Tahrirlash / o'chirish ---------------------------------------------
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
    editDrawer.onOpen();
  };

  const handleSubmitEdit = async (form) => {
    if (!editingExpense?.id) return;
    setIsSaving(true);
    try {
      await apiCost.Update(editingExpense.id, {
        odometer_end: form.odometer_end,
        received_amount: form.received_amount,
        is_holiday: form.is_holiday,
        note: form.note,
      });
      toast({ title: "Yozuv yangilandi", status: "success", duration: 2500 });
      editDrawer.onClose();
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
  const noCarSelected = !selectedCarId;

  return (
    <Box
      bg="bg"
      minH="100vh"
      w="100%"
      px={{ base: 4, md: 8, xl: 12 }}
      py={{ base: 4, md: 8 }}
    >
      {/* Sarlavha */}
      <Box mb={6}>
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

      {/* Mashina tanlash */}
      <CarSelector
        cars={cars}
        carsLoading={carsLoading}
        selectedCarId={selectedCarId}
        onChange={handleCarChange}
      />

      {/* TEPADA: yangi xarajat qo'shish — mustaqil, alohida panel */}
      <NewExpenseCard
        newRow={newRow}
        onChange={updateNewRow}
        onAdd={handleAddRow}
        isSaving={isSavingRow}
        fuelTypes={fuelTypes}
        fuelTypesLoading={fuelTypesLoading}
        disabled={noCarSelected}
      />

      {/* Filtrlar */}
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
        opacity={noCarSelected ? 0.5 : 1}
        pointerEvents={noCarSelected ? "none" : "auto"}
      >
        <FilterBar
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          fuelTypes={fuelTypes}
          fuelTypesLoading={fuelTypesLoading}
        />
      </Box>

      {/* PASTDA: mavjud yozuvlar jadvali */}
      <Box
        bg="surface"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        boxShadow="md"
        overflow="hidden"
        w="100%"
      >
        <Box>
          <ExpenseTable
            items={expenses}
            loading={loading}
            onEdit={openEditForm}
            onDelete={askDelete}
            fuelTypesById={fuelTypesById}
            noCarSelected={noCarSelected}
          />

          {!noCarSelected && !loading && expenses.length > 0 && (
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
                    {...inputStyles}
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

      {/* Tahrirlash va o'chirish oynalari */}
      <EditExpenseDrawer
        isOpen={editDrawer.isOpen}
        onClose={editDrawer.onClose}
        initialData={editingExpense}
        onSubmit={handleSubmitEdit}
        isSaving={isSaving}
        fuelTypesById={fuelTypesById}
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
