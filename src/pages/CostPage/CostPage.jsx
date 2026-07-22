import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  HStack,
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
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Divider,
  Center,
  NumberInput,
  NumberInputField,
  Heading,
  Tooltip,
} from "@chakra-ui/react";
import {
  Plus,
  Fuel,
  Check,
  X,
  CalendarDays,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  Car,
} from "lucide-react";
import { apiCost } from "../../Services/api/apiCost";
import { apiFuel } from "../../Services/api/Fuels";
import { apiCars } from "../../Services/api/Cars";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Hozirgi kunni formatlash
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EMPTY_NEW_ROW = {
  date: getTodayDate(),
  fuel_id: "",
  odometer_start: "",
  distance: "",
  received_amount: "",
  is_holiday: false,
};

const EMPTY_EDIT_FORM = {
  date: "",
  fuel_id: "",
  odometer_start: "",
  distance: "",
  received_amount: "",
  is_holiday: false,
};

// Yoqilg'i turlari va ularning unitlari
const FUEL_UNIT_MAP = {
  "AI 100": "litr",
  "AI-100": "litr",
  AI100: "litr",
  "AI 93": "litr",
  "AI-93": "litr",
  AI93: "litr",
  dizel: "litr",
  "dizel EKO": "litr",
  "dizel-eko": "litr",
  elektr: "kwh",
  electric: "kwh",
  metan: "m3",
  methane: "m3",
};

// Yoqilg'i turlari ranglari
const FUEL_COLOR_MAP = {
  "AI 100": "purple",
  "AI-100": "purple",
  AI100: "purple",
  "AI 93": "amber",
  "AI-93": "amber",
  AI93: "amber",
  dizel: "neutral",
  "dizel EKO": "green",
  "dizel-eko": "green",
  elektr: "cyan",
  electric: "cyan",
  metan: "primary",
  methane: "primary",
};

const FUEL_COLOR_PALETTE = [
  "amber",
  "secondary",
  "accent",
  "success",
  "primary",
  "neutral",
  "purple",
  "orange",
  "green",
  "cyan",
];

function getFuelColorScheme(rawName, index) {
  if (!rawName) return FUEL_COLOR_PALETTE[index % FUEL_COLOR_PALETTE.length];

  const key = (rawName || "").toString().trim().toLowerCase();

  // To'g'ridan-to'g'ri nom bo'yicha qidirish
  for (const [fuelName, color] of Object.entries(FUEL_COLOR_MAP)) {
    if (
      key === fuelName.toLowerCase() ||
      key.toLowerCase() === fuelName.toLowerCase()
    ) {
      return color;
    }
  }

  // Qisman moslik
  if (
    key.includes("ai 100") ||
    key.includes("ai-100") ||
    key.includes("ai100")
  ) {
    return "purple";
  }
  if (key.includes("ai 93") || key.includes("ai-93") || key.includes("ai93")) {
    return "amber";
  }
  if (key.includes("dizel eko") || key.includes("dizel-eko")) {
    return "green";
  }
  if (key.includes("dizel")) {
    return "neutral";
  }
  if (key.includes("elektr") || key.includes("electric")) {
    return "cyan";
  }
  if (key.includes("metan") || key.includes("methane")) {
    return "primary";
  }

  return FUEL_COLOR_PALETTE[index % FUEL_COLOR_PALETTE.length];
}

// Yoqilg'i nomi bo'yicha birlikni aniqlash:
// AI 100 / AI 93 / dizel / dizel EKO -> litr
// elektr -> kwh
// metan -> m3
function getFuelUnit(rawName) {
  if (!rawName) return "litr";

  const key = (rawName || "").toString().trim();

  // To'g'ridan-to'g'ri nom bo'yicha qidirish
  for (const [fuelName, unit] of Object.entries(FUEL_UNIT_MAP)) {
    if (key === fuelName || key.toLowerCase() === fuelName.toLowerCase()) {
      return unit;
    }
  }

  // Qisman moslikni tekshirish
  const lowerKey = key.toLowerCase();

  // Elektr -> kwh (eng avval tekshiramiz, chunki boshqa so'zlar bilan aralashmasligi kerak)
  if (lowerKey.includes("elektr") || lowerKey.includes("electric")) {
    return "kwh";
  }

  // Metan -> m3
  if (lowerKey.includes("metan") || lowerKey.includes("methane")) {
    return "m3";
  }

  // AI 100, AI-100, AI100 -> litr
  if (
    lowerKey.includes("ai 100") ||
    lowerKey.includes("ai-100") ||
    lowerKey.includes("ai100")
  ) {
    return "litr";
  }

  // AI 93, AI-93, AI93 -> litr
  if (
    lowerKey.includes("ai 93") ||
    lowerKey.includes("ai-93") ||
    lowerKey.includes("ai93")
  ) {
    return "litr";
  }

  // Dizel / dizel EKO -> litr
  if (lowerKey.includes("dizel")) {
    return "litr";
  }

  return "litr"; // default
}

function pick(obj, keys, fallback = 0) {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  const nested = pick(payload, ["items", "data", "results"], null);
  if (Array.isArray(nested)) return nested;
  return [];
}

function extractSingle(payload) {
  if (!payload) return null;
  if (payload.id !== undefined) return payload;
  const nested = pick(payload, ["data", "item", "result"], null);
  if (nested && typeof nested === "object") return nested;
  return payload;
}

function normalizeFuelType(raw, index) {
  const id = pick(raw, ["id", "_id", "uuid"], null);
  const label = pick(raw, ["name", "label", "title"], id ?? "Noma'lum");

  // Unitni yoqilg'i nomiga qarab aniqlaymiz (litr / kwh / m3)
  const unit = getFuelUnit(label);

  const price = pick(
    raw,
    ["price", "unit_price", "cost_per_unit", "price_per_unit", "narx"],
    null,
  );

  return {
    id,
    label: String(label),
    unit: unit,
    price: price !== null && price !== undefined ? Number(price) : null,
    colorScheme: getFuelColorScheme(label, index),
  };
}

function normalizeCar(raw) {
  const id = pick(raw, ["id", "_id", "uuid"], null);
  const name = pick(raw, ["name", "model", "car_name", "title", "brand"], null);
  const plate = pick(
    raw,
    ["plate_number", "gov_number", "number", "plate"],
    null,
  );
  const odometer = pick(
    raw,
    [
      "speedometer",
      "odometer",
      "mileage",
      "current_odometer",
      "current_mileage",
      "total_km",
      "km",
      "probeg",
    ],
    null,
  );
  const label = [name, plate].filter(Boolean).join(" — ") || id || "Noma'lum";
  return {
    id,
    label: String(label),
    odometer:
      odometer !== null && odometer !== undefined ? Number(odometer) : null,
  };
}

function extractComputed(row) {
  return {
    distance: pick(
      row,
      ["distance", "km", "mileage", "driven_km", "traveled_km"],
      null,
    ),
    fuelConsumed: pick(
      row,
      [
        "fuel_expence",
        "fuel_expense",
        "consumed_fuel",
        "fuel_consumed",
        "spent_fuel",
        "fuel_spent",
      ],
      null,
    ),
    sum: pick(
      row,
      [
        "fuel_price_sum",
        "sum",
        "total_price",
        "total_sum",
        "price_sum",
        "amount_sum",
        "total_amount",
      ],
      null,
    ),
    balanceAfter: pick(
      row,
      [
        "balance_after",
        "remaining_amount",
        "fuel_balance",
        "balance",
        "remaining_fuel",
        "leftover_fuel",
      ],
      null,
    ),
  };
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

const inputStyles = {
  bg: "surface",
  color: "text",
  borderWidth: "1px",
  borderColor: "border",
  fontWeight: "500",
  borderRadius: "md",
  transition: "all 0.2s ease",
  _placeholder: { color: "textSecondary" },
  _hover: { borderColor: "primary.400" },
  _focus: {
    borderColor: "primary.500",
    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.15)",
  },
};

function UnitNumberInput({
  value,
  onChange,
  unit,
  isDisabled,
  placeholder = "0",
  size = "sm",
}) {
  return (
    <Box position="relative">
      <NumberInput
        size={size}
        min={0}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        keepWithinRange={false}
      >
        <NumberInputField
          placeholder={placeholder}
          textAlign="right"
          pr="46px"
          {...inputStyles}
        />
      </NumberInput>
      <Text
        position="absolute"
        right="12px"
        top="50%"
        transform="translateY(-50%)"
        fontSize="xs"
        color="textSecondary"
        pointerEvents="none"
        userSelect="none"
      >
        {unit}
      </Text>
    </Box>
  );
}

function AutoCell({ value, unit, tooltip }) {
  return (
    <Tooltip label={tooltip} placement="top" hasArrow openDelay={300}>
      <Text color="textSecondary" fontSize="sm" cursor="default">
        {value === null || value === undefined || value === ""
          ? "—"
          : `${formatNumber(value)}${unit ? ` ${unit}` : ""}`}
      </Text>
    </Tooltip>
  );
}

// Taxminiy qiymatlar endi "~" belgisisiz ko'rsatiladi
function EstimatedCell({ value, unit, tooltip }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(value)
  ) {
    return <AutoCell value={null} tooltip={tooltip} />;
  }
  return (
    <Tooltip
      label="Taxminiy (saqlangach aniqlashadi)"
      placement="top"
      hasArrow
      openDelay={300}
    >
      <Text color="text" fontSize="sm" fontWeight="semibold" cursor="default">
        {formatNumber(value)}
        {unit ? ` ${unit}` : ""}
      </Text>
    </Tooltip>
  );
}

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
        Yuqoridagi jadval qatoriga ma'lumot kiritib, yangi xarajat qo'shing yoki
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

function FilterBar({
  filters,
  onChange,
  onReset,
  fuelTypes,
  fuelTypesLoading,
}) {
  return (
    <Flex direction="row" gap={3} wrap="wrap" align="center">
      <Input
        type="date"
        value={filters.date_from}
        onChange={(e) => onChange({ date_from: e.target.value })}
        maxW="170px"
        size="sm"
        {...inputStyles}
      />
      <Input
        type="date"
        value={filters.date_to}
        onChange={(e) => onChange({ date_to: e.target.value })}
        maxW="170px"
        size="sm"
        {...inputStyles}
      />

      {fuelTypesLoading ? (
        <Skeleton h="32px" w="160px" borderRadius="md" />
      ) : (
        <Select
          value={filters.fuel_id}
          onChange={(e) => onChange({ fuel_id: e.target.value })}
          maxW="160px"
          size="sm"
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

      <Tooltip
        label={
          filters.sortOrder === "ASC"
            ? "Eski sanalar tepada (o'sish tartibi)"
            : "Yangi sanalar tepada (kamayish tartibi)"
        }
        hasArrow
      >
        <IconButton
          aria-label="Sana tartibini almashtirish"
          icon={<ArrowUpDown size={16} />}
          variant="outline"
          size="sm"
          borderRadius="md"
          onClick={() =>
            onChange({
              sortOrder: filters.sortOrder === "ASC" ? "DESC" : "ASC",
            })
          }
        />
      </Tooltip>

      <Button
        variant="ghost"
        leftIcon={<X size={16} />}
        onClick={onReset}
        ml="auto"
        size="sm"
      >
        Tozalash
      </Button>
    </Flex>
  );
}

function CarSelector({
  cars,
  carsLoading,
  selectedCarId,
  onCarChange,
  filters,
  onFilterChange,
  onFilterReset,
  fuelTypes,
  fuelTypesLoading,
}) {
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
        <FormLabel fontSize="sm" color="textSecondary" fontWeight="semibold">
          Mashina
        </FormLabel>
        {carsLoading ? (
          <Skeleton
            h="36px"
            w={{ base: "100%", md: "320px" }}
            borderRadius="md"
          />
        ) : (
          <InputGroup maxW={{ base: "100%", md: "320px" }}>
            <InputLeftElement pointerEvents="none">
              <Car size={16} color="var(--chakra-colors-textSecondary)" />
            </InputLeftElement>
            <Select
              value={selectedCarId}
              onChange={(e) => onCarChange(e.target.value)}
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

      <Divider my={5} borderColor="border" />

      <FilterBar
        filters={filters}
        onChange={onFilterChange}
        onReset={onFilterReset}
        fuelTypes={fuelTypes}
        fuelTypesLoading={fuelTypesLoading}
      />
    </Box>
  );
}

/**
 * Yoqilg'i sarf normasini (100 km ga necha litr) backend'dan olish
 * car_id va fuel_id bo'yicha
 */
function useFuelNormRate(carId, fuelId) {
  const [rate, setRate] = useState(null);

  useEffect(() => {
    if (!carId || !fuelId) {
      setRate(null);
      return;
    }
    let cancelled = false;

    apiCars
      .AllNorms(1, 1, carId, fuelId)
      .then((response) => {
        if (cancelled) return;
        const list = extractList(response?.data);
        const normRaw = list[0];
        if (!normRaw) {
          setRate(null);
          return;
        }
        const r = pick(
          normRaw,
          [
            "rate",
            "norm",
            "consumption_rate",
            "fuel_per_100km",
            "norm_per_100km",
            "consumption_per_100km",
            "rate_100km",
            "norm_100",
          ],
          null,
        );
        setRate(r !== null ? Number(r) : null);
      })
      .catch(() => {
        if (!cancelled) setRate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [carId, fuelId]);

  return rate;
}

/**
 * Qoldiqni hisoblash uchun oxirgi yozuvdagi qoldiqni olish
 */
function useLastBalance(carId) {
  const [lastBalance, setLastBalance] = useState(null);

  useEffect(() => {
    if (!carId) {
      setLastBalance(null);
      return;
    }
    let cancelled = false;

    apiCost
      .All(1, 1, {
        car_id: carId,
        sortBy: "date",
        sortOrder: "DESC",
      })
      .then((response) => {
        if (cancelled) return;
        const list = extractList(response);
        if (list.length > 0) {
          const computed = extractComputed(list[0]);
          setLastBalance(computed.balanceAfter);
        } else {
          setLastBalance(0);
        }
      })
      .catch(() => {
        if (!cancelled) setLastBalance(null);
      });

    return () => {
      cancelled = true;
    };
  }, [carId]);

  return lastBalance;
}

function NewRowInline({
  newRow,
  onChange,
  onAdd,
  isSaving,
  fuelTypes,
  fuelTypesLoading,
  fuelTypesById,
  disabled,
  selectedCarId,
}) {
  const rowBg = useColorModeValue("primary.50", "whiteAlpha.100");
  const rowBorder = useColorModeValue("primary.100", "whiteAlpha.200");

  const fuelMeta = fuelTypesById?.[newRow.fuel_id];
  const selectedUnit = fuelMeta?.unit || "litr";

  const estimatedSum =
    fuelMeta?.price && newRow.received_amount !== ""
      ? Number(newRow.received_amount) * Number(fuelMeta.price)
      : null;

  const hasDistance = newRow.distance !== "" && Number(newRow.distance) > 0;
  const computedOdometerEnd =
    newRow.odometer_start !== "" && hasDistance
      ? Number(newRow.odometer_start) + Number(newRow.distance)
      : null;

  const normRate = useFuelNormRate(selectedCarId, newRow.fuel_id);
  const estimatedFuelConsumed =
    normRate !== null && hasDistance
      ? (Number(newRow.distance) * normRate) / 100
      : null;

  const lastBalance = useLastBalance(selectedCarId);
  const computedBalanceAfter =
    lastBalance !== null && newRow.received_amount !== "" && hasDistance
      ? Number(lastBalance) +
        Number(newRow.received_amount) -
        (estimatedFuelConsumed || 0)
      : null;

  const isValid =
    !disabled &&
    newRow.date &&
    newRow.fuel_id &&
    newRow.odometer_start !== "" &&
    hasDistance &&
    newRow.received_amount !== "";

  return (
    <Tr bg={rowBg} borderBottomWidth="1px" borderColor={rowBorder}>
      <Td borderColor="border" py={2}>
        <Input
          type="date"
          size="sm"
          value={newRow.date}
          onChange={(e) => onChange({ date: e.target.value })}
          isDisabled={disabled}
          {...inputStyles}
        />
      </Td>

      <Td borderColor="border">
        {fuelTypesLoading ? (
          <Skeleton h="32px" borderRadius="md" />
        ) : (
          <Select
            size="sm"
            value={newRow.fuel_id}
            onChange={(e) => onChange({ fuel_id: e.target.value })}
            isDisabled={disabled}
            {...inputStyles}
          >
            {fuelTypes.length === 0 && <option value="">—</option>}
            {fuelTypes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        )}
      </Td>

      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={newRow.received_amount}
          onChange={(val) => onChange({ received_amount: val })}
          isDisabled={disabled}
          unit={selectedUnit}
          size="sm"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={estimatedFuelConsumed}
          unit={selectedUnit}
          tooltip="Sarf normasi orqali taxminiy hisoblanadi"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <AutoCell
          value={newRow.odometer_start}
          unit="km"
          tooltip="Avtomatik: oldingi yozuvning oxirgi spidometridan olinadi"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <AutoCell
          value={computedOdometerEnd}
          unit="km"
          tooltip="Avtomatik: spidometr boshi + yurgan km"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={newRow.distance}
          onChange={(val) => onChange({ distance: val })}
          isDisabled={disabled}
          unit="km"
          size="sm"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={estimatedSum}
          unit="so'm"
          tooltip="Avtomatik hisoblanadi"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={computedBalanceAfter}
          unit={selectedUnit}
          tooltip="Avtomatik: oldingi qoldiq + olingan - sarflangan"
        />
      </Td>

      <Td borderColor="border">
        <HStack spacing={2}>
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
      </Td>

      <Td borderColor="border">
        <IconButton
          aria-label="Qo'shish"
          icon={<Plus size={16} />}
          size="sm"
          colorScheme="primary"
          borderRadius="md"
          onClick={onAdd}
          isDisabled={disabled || !isValid}
          isLoading={isSaving}
        />
      </Td>
    </Tr>
  );
}

function EditRowInline({
  editForm,
  onChange,
  onSave,
  onCancel,
  isSaving,
  fuelTypesById,
  selectedCarId,
}) {
  const rowBg = useColorModeValue("accent.50", "whiteAlpha.150");
  const rowBorder = useColorModeValue("accent.100", "whiteAlpha.300");

  const hasDistance = editForm.distance !== "" && Number(editForm.distance) > 0;
  const computedOdometerEnd =
    editForm.odometer_start !== "" && hasDistance
      ? Number(editForm.odometer_start) + Number(editForm.distance)
      : null;

  const isValid =
    editForm.odometer_start !== "" &&
    hasDistance &&
    editForm.received_amount !== "";

  const fuelMeta = fuelTypesById[editForm.fuel_id];
  const selectedUnit = fuelMeta?.unit || "litr";

  const estimatedSum =
    fuelMeta?.price && editForm.received_amount !== ""
      ? Number(editForm.received_amount) * Number(fuelMeta.price)
      : null;

  const normRate = useFuelNormRate(selectedCarId, editForm.fuel_id);
  const estimatedFuelConsumed =
    normRate !== null && hasDistance
      ? (Number(editForm.distance) * normRate) / 100
      : null;

  const lastBalance = useLastBalance(selectedCarId);
  const computedBalanceAfter =
    lastBalance !== null && editForm.received_amount !== "" && hasDistance
      ? Number(lastBalance) +
        Number(editForm.received_amount) -
        (estimatedFuelConsumed || 0)
      : null;

  return (
    <Tr bg={rowBg} borderBottomWidth="1px" borderColor={rowBorder}>
      <Td borderColor="border" py={2}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <CalendarDays
              size={14}
              color="var(--chakra-colors-textSecondary)"
            />
          </InputLeftElement>
          <Input value={editForm.date} isDisabled pl={8} {...inputStyles} />
        </InputGroup>
      </Td>

      <Td borderColor="border">
        <Badge
          colorScheme={fuelMeta?.colorScheme || "neutral"}
          borderRadius="md"
          px={2.5}
          py={1}
          fontWeight="bold"
        >
          {fuelMeta?.label || editForm.fuel_id || "—"}
        </Badge>
      </Td>

      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={editForm.received_amount}
          onChange={(val) => onChange({ received_amount: val })}
          unit={selectedUnit}
          size="sm"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={estimatedFuelConsumed}
          unit={selectedUnit}
          tooltip="Sarf normasi orqali taxminiy hisoblanadi"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <AutoCell
          value={editForm.odometer_start}
          unit="km"
          tooltip="Avtomatik — bu yozuvning boshlang'ich spidometri"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <AutoCell
          value={computedOdometerEnd}
          unit="km"
          tooltip="Avtomatik: spidometr boshi + yurgan km"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={editForm.distance}
          onChange={(val) => onChange({ distance: val })}
          unit="km"
          size="sm"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={estimatedSum}
          unit="so'm"
          tooltip="Saqlagach qayta hisoblanadi"
        />
      </Td>

      <Td isNumeric borderColor="border">
        <EstimatedCell
          value={computedBalanceAfter}
          unit={selectedUnit}
          tooltip="Avtomatik hisoblanadi"
        />
      </Td>

      <Td borderColor="border">
        <HStack spacing={2}>
          <Switch
            size="sm"
            isChecked={editForm.is_holiday}
            onChange={(e) => onChange({ is_holiday: e.target.checked })}
            colorScheme="accent"
          />
          <Text fontSize="xs" color="textSecondary" whiteSpace="nowrap">
            Dam olish
          </Text>
        </HStack>
      </Td>

      <Td borderColor="border">
        <HStack spacing={1}>
          <IconButton
            aria-label="Saqlash"
            icon={<Check size={16} />}
            size="sm"
            colorScheme="primary"
            borderRadius="md"
            onClick={onSave}
            isDisabled={!isValid}
            isLoading={isSaving}
          />
          <IconButton
            aria-label="Bekor qilish"
            icon={<X size={16} />}
            size="sm"
            variant="ghost"
            borderRadius="md"
            onClick={onCancel}
            isDisabled={isSaving}
          />
        </HStack>
      </Td>
    </Tr>
  );
}

function DataRow({
  row,
  idx,
  fuelTypesById,
  editingId,
  onStartEdit,
  onDelete,
}) {
  const { distance, fuelConsumed, sum, balanceAfter } = extractComputed(row);

  const fuelMeta = fuelTypesById[row.fuel_id] || row.fuel || null;
  const fuelUnit = row.fuel_unit || fuelMeta?.unit || "litr";
  const fuelPrice =
    fuelMeta?.price !== undefined && fuelMeta?.price !== null
      ? Number(fuelMeta.price)
      : null;

  const displaySum =
    sum !== null
      ? sum
      : fuelPrice !== null &&
          row.received_amount !== undefined &&
          row.received_amount !== null
        ? Number(row.received_amount) * fuelPrice
        : null;
  const sumIsComputedLocally = sum === null && displaySum !== null;

  return (
    <Tr
      bg={idx % 2 === 1 ? "bg" : "surface"}
      _hover={{ bg: "primaryBg" }}
      transition="background 0.15s ease"
    >
      <Td fontWeight="semibold" color="text" borderColor="border" py={3.5}>
        {formatDate(row.date)}
      </Td>

      <Td borderColor="border">
        <FuelBadge fuelId={row.fuel_id} fuelTypesById={fuelTypesById} />
      </Td>

      <Td isNumeric color="text" borderColor="border">
        {formatNumber(row.received_amount)} {fuelUnit}
      </Td>

      <Td isNumeric color="textSecondary" borderColor="border">
        <AutoCell
          value={fuelConsumed}
          unit={fuelUnit}
          tooltip="Backend hisoblagan"
        />
      </Td>

      <Td isNumeric color="textSecondary" borderColor="border">
        {formatNumber(row.odometer_start)} km
      </Td>

      <Td isNumeric color="textSecondary" borderColor="border">
        {formatNumber(row.odometer_end)} km
      </Td>

      <Td isNumeric fontWeight="bold" color="text" borderColor="border">
        {distance !== null
          ? `${formatNumber(distance)} km`
          : row.odometer_start !== undefined && row.odometer_end !== undefined
            ? `${formatNumber(
                Number(row.odometer_end) - Number(row.odometer_start),
              )} km`
            : "—"}
      </Td>

      <Td isNumeric fontWeight="bold" color="text" borderColor="border">
        <AutoCell
          value={displaySum}
          unit="so'm"
          tooltip={
            sumIsComputedLocally
              ? "Olingan yoqilg'i x narx asosida hisoblangan"
              : "Backend hisoblagan"
          }
        />
      </Td>

      <Td isNumeric color="textSecondary" borderColor="border">
        <AutoCell
          value={balanceAfter}
          unit={fuelUnit}
          tooltip="Backend hisoblagan"
        />
      </Td>

      <Td borderColor="border">
        {row.is_holiday ? (
          <Badge colorScheme="accent" variant="subtle" borderRadius="md">
            Dam olish
          </Badge>
        ) : (
          <Text color="textSecondary" fontSize="sm">
            —
          </Text>
        )}
      </Td>

      <Td borderColor="border">
        <HStack spacing={1}>
          <IconButton
            aria-label="Tahrirlash"
            icon={<Pencil size={14} />}
            size="sm"
            variant="ghost"
            borderRadius="md"
            color="blue.500"
            _hover={{ bg: "blue.50", color: "blue.600" }}
            onClick={() => onStartEdit(row)}
            isDisabled={editingId !== null}
          />
          <IconButton
            aria-label="O'chirish"
            icon={<Trash2 size={14} />}
            size="sm"
            variant="ghost"
            borderRadius="md"
            color="red.500"
            _hover={{ bg: "red.50", color: "red.600" }}
            onClick={() => onDelete(row)}
            isDisabled={editingId !== null}
          />
        </HStack>
      </Td>
    </Tr>
  );
}

function ExpenseTable({
  items,
  loading,
  fuelTypesById,
  noCarSelected,
  newRow,
  onNewRowChange,
  onAddRow,
  isSavingRow,
  fuelTypes,
  fuelTypesLoading,
  editingId,
  editForm,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  isSavingEdit,
  onDelete,
  selectedCarId,
}) {
  if (noCarSelected) {
    return <NoCarState />;
  }

  const header = (
    <Thead bg="bg" position="sticky" top={0} zIndex={1}>
      <Tr>
        <Th color="textSecondary" borderColor="border" py={4} minW="110px">
          Sana
        </Th>
        <Th color="textSecondary" borderColor="border" minW="110px">
          Yoqilg'i
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="110px">
          Olingan
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="110px">
          <Tooltip label="Avtomatik hisoblanadi" hasArrow>
            <Text
              as="span"
              borderBottom="1px dashed"
              borderColor="textSecondary"
              cursor="default"
            >
              Sarflangan
            </Text>
          </Tooltip>
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          <Tooltip label="Avtomatik hisoblanadi" hasArrow>
            <Text
              as="span"
              borderBottom="1px dashed"
              borderColor="textSecondary"
              cursor="default"
            >
              Spidometr (boshi)
            </Text>
          </Tooltip>
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          <Tooltip label="Avtomatik hisoblanadi" hasArrow>
            <Text
              as="span"
              borderBottom="1px dashed"
              borderColor="textSecondary"
              cursor="default"
            >
              Spidometr (oxiri)
            </Text>
          </Tooltip>
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          Yurgan (km)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="120px">
          <Tooltip label="Avtomatik hisoblanadi" hasArrow>
            <Text
              as="span"
              borderBottom="1px dashed"
              borderColor="textSecondary"
              cursor="default"
            >
              Summa (so'm)
            </Text>
          </Tooltip>
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="110px">
          <Tooltip label="Avtomatik hisoblanadi" hasArrow>
            <Text
              as="span"
              borderBottom="1px dashed"
              borderColor="textSecondary"
              cursor="default"
            >
              Qoldiq
            </Text>
          </Tooltip>
        </Th>
        <Th color="textSecondary" borderColor="border" minW="100px">
          Holat
        </Th>
        <Th borderColor="border" w="1%" minW="80px">
          Amallar
        </Th>
      </Tr>
    </Thead>
  );

  const renderRow = (row, idx) => {
    if (row.id === editingId) {
      return (
        <EditRowInline
          key={row.id}
          editForm={editForm}
          onChange={onEditFormChange}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isSaving={isSavingEdit}
          fuelTypesById={fuelTypesById}
          selectedCarId={selectedCarId}
        />
      );
    }
    return (
      <DataRow
        key={row.id}
        row={row}
        idx={idx}
        fuelTypesById={fuelTypesById}
        editingId={editingId}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
      />
    );
  };

  return (
    <TableContainer w="100%" maxH="calc(100vh - 400px)" overflowY="auto">
      <Table variant="simple" size="sm" w="100%">
        {header}
        <Tbody>
          {loading &&
            [...Array(4)].map((_, i) => (
              <Tr key={`skeleton-${i}`}>
                <Td colSpan={11} borderColor="border" py={2}>
                  <Skeleton height="32px" borderRadius="md" />
                </Td>
              </Tr>
            ))}

          {!loading && items.length === 0 && (
            <Tr>
              <Td colSpan={11} border="none" p={0}>
                <EmptyState />
              </Td>
            </Tr>
          )}

          {!loading && items.map((row, i) => renderRow(row, i))}

          <NewRowInline
            newRow={newRow}
            onChange={onNewRowChange}
            onAdd={onAddRow}
            isSaving={isSavingRow}
            fuelTypes={fuelTypes}
            fuelTypesLoading={fuelTypesLoading}
            fuelTypesById={fuelTypesById}
            disabled={noCarSelected}
            selectedCarId={selectedCarId}
          />
        </Tbody>
      </Table>
    </TableContainer>
  );
}

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
              colorScheme="red"
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

const DEFAULT_FILTERS = {
  fuel_id: "",
  date_from: "",
  date_to: "",
  sortBy: "date",
  sortOrder: "ASC",
};

function CostPage() {
  const toast = useToast();

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

  const [newRow, setNewRow] = useState({
    ...EMPTY_NEW_ROW,
    date: getTodayDate(),
  });
  const [isSavingRow, setIsSavingRow] = useState(false);

  useEffect(() => {
    if (fuelTypes.length && !newRow.fuel_id) {
      setNewRow((prev) => ({ ...prev, fuel_id: fuelTypes[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelTypes]);

  const updateNewRow = (patch) => {
    setNewRow((prev) => ({ ...prev, ...patch }));
  };

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    setEditingId(null);
    setNewRow({
      ...EMPTY_NEW_ROW,
      date: getTodayDate(),
      fuel_id: newRow.fuel_id || (fuelTypes.length > 0 ? fuelTypes[0].id : ""),
    });
  };

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

  // Yangi qator uchun "Spidometr (boshi)"ni avtomatik to'ldirish:
  useEffect(() => {
    if (!selectedCarId) return;
    if (loading) return;
    if (newRow.odometer_start !== "") return;

    if (expenses && expenses.length > 0) {
      const latest = expenses.reduce((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db > da ? b : a;
      });

      if (latest?.odometer_end !== undefined && latest?.odometer_end !== null) {
        setNewRow((prev) => ({
          ...prev,
          odometer_start: String(latest.odometer_end),
        }));
        return;
      }
    }

    const car = cars.find((c) => c.id === selectedCarId);
    if (car?.odometer !== undefined && car?.odometer !== null) {
      setNewRow((prev) => ({
        ...prev,
        odometer_start: String(car.odometer),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCarId, expenses, loading, cars]);

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
      newRow.odometer_start === "" ||
      newRow.distance === "" ||
      newRow.received_amount === ""
    ) {
      toast({
        title: "Barcha maydonlarni to'ldiring",
        description:
          "Sana, yoqilg'i turi, necha km yurgan va olingan miqdor kerak",
        status: "warning",
        duration: 3500,
      });
      return;
    }

    if (Number(newRow.distance) <= 0) {
      toast({
        title: "Xatolik",
        description: "Yurgan km 0 dan katta bo'lishi kerak",
        status: "error",
        duration: 3500,
      });
      return;
    }

    const odometerStart = Number(newRow.odometer_start);
    const odometerEnd = odometerStart + Number(newRow.distance);

    setIsSavingRow(true);
    try {
      const response = await apiCost.Create({
        car_id: selectedCarId,
        fuel_id: newRow.fuel_id,
        date: newRow.date,
        odometer_start: odometerStart,
        odometer_end: odometerEnd,
        received_amount: Number(newRow.received_amount),
        is_holiday: newRow.is_holiday,
        note: "",
      });

      const created = extractSingle(response);
      if (created && created.id !== undefined) {
        setExpenses((prev) => [...prev, created]);
        setTotal((prev) => prev + 1);
      }

      toast({
        title: "Yangi xarajat qo'shildi",
        status: "success",
        duration: 2500,
      });

      setNewRow({
        ...EMPTY_NEW_ROW,
        date: getTodayDate(),
        fuel_id: newRow.fuel_id,
        odometer_start: String(odometerEnd),
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

  const startEdit = (row) => {
    const start = Number(row.odometer_start) || 0;
    const end = Number(row.odometer_end) || 0;
    setEditingId(row.id);
    setEditForm({
      date: row.date?.slice(0, 10) || "",
      fuel_id: row.fuel_id,
      odometer_start: row.odometer_start ?? "",
      distance: end > start ? String(end - start) : "",
      received_amount: row.received_amount || "",
      is_holiday: !!row.is_holiday,
    });
  };

  const updateEditForm = (patch) =>
    setEditForm((prev) => ({ ...prev, ...patch }));

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (
      editForm.odometer_start === "" ||
      editForm.distance === "" ||
      editForm.received_amount === ""
    ) {
      toast({
        title: "Yurgan km va olingan miqdor kerak",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (Number(editForm.distance) <= 0) {
      toast({
        title: "Xatolik",
        description: "Yurgan km 0 dan katta bo'lishi kerak",
        status: "error",
        duration: 3500,
      });
      return;
    }

    const odometerStart = Number(editForm.odometer_start);
    const odometerEnd = odometerStart + Number(editForm.distance);

    setIsSavingEdit(true);
    try {
      const response = await apiCost.Update(editingId, {
        odometer_start: odometerStart,
        odometer_end: odometerEnd,
        received_amount: Number(editForm.received_amount),
        is_holiday: editForm.is_holiday,
      });

      const updated = extractSingle(response);
      if (updated && updated.id !== undefined) {
        setExpenses((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item)),
        );
      }

      toast({ title: "Yozuv yangilandi", status: "success", duration: 2500 });
      cancelEdit();
      loadExpenses();
    } catch (err) {
      toast({
        title: "Saqlab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSavingEdit(false);
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
      maxW="100%"
      px={{ base: 3, md: 5, xl: 6 }}
      py={{ base: 4, md: 8 }}
    >
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

      <CarSelector
        cars={cars}
        carsLoading={carsLoading}
        selectedCarId={selectedCarId}
        onCarChange={handleCarChange}
        filters={filters}
        onFilterChange={updateFilters}
        onFilterReset={resetFilters}
        fuelTypes={fuelTypes}
        fuelTypesLoading={fuelTypesLoading}
      />

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
            fuelTypesById={fuelTypesById}
            noCarSelected={noCarSelected}
            newRow={newRow}
            onNewRowChange={updateNewRow}
            onAddRow={handleAddRow}
            isSavingRow={isSavingRow}
            fuelTypes={fuelTypes}
            fuelTypesLoading={fuelTypesLoading}
            editingId={editingId}
            editForm={editForm}
            onEditFormChange={updateEditForm}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            isSavingEdit={isSavingEdit}
            onDelete={askDelete}
            selectedCarId={selectedCarId}
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
                    borderRadius="md"
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
                    variant="outline"
                    borderRadius="md"
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
                    variant="outline"
                    borderRadius="md"
                    isDisabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </HStack>
              </Flex>
            </>
          )}
        </Box>
      </Box>

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
