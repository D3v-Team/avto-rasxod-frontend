import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Skeleton,
  useDisclosure,
  useColorModeValue,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Center,
  NumberInput,
  NumberInputField,
  Heading,
} from "@chakra-ui/react";
import {
  Fuel,
  Check,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Car,
  LayoutGrid,
  List,
  Download,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";
import { apiCost } from "../../Services/api/apiCost";
import { apiFuel } from "../../Services/api/Fuels";
import { apiCars } from "../../Services/api/Cars";
import { toastService } from "../../utils/toast";

const FETCH_LIMIT = 100;

const formatAsInputDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => formatAsInputDate(new Date());
const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;

const isFutureDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
};

// 404 -- "ma'lumot topilmadi" degani, haqiqiy xatolik emas. Bunday holatda
// foydalanuvchiga qizil xato toast ko'rsatilmasin, shunchaki bo'sh natija
// sifatida qabul qilinsin.
function isNotFoundError(err) {
  const status = err?.response?.status ?? err?.status;
  if (status === 404) return true;
  const message = String(err?.message || "");
  return message.includes("404");
}

const MONTH_NAMES_UZ = [
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

function getYearOptions() {
  const current = getCurrentYear();
  const years = [];
  for (let y = current - 1; y <= current + 4; y++) years.push(y);
  return years;
}

function getMonthStartDateFor(year, month) {
  return formatAsInputDate(new Date(year, month - 1, 1));
}

function getMonthDateRange(year, month) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return {
    date_from: formatAsInputDate(from),
    date_to: formatAsInputDate(to),
  };
}

// Tanlangan oyning birinchi kunidan bir kun oldingi sana. Yoqilg'i
// qoldig'ining "oy boshidan oldingi" bazaviy qiymatini olish uchun ishlatiladi.
function getDayBeforeMonthStart(year, month) {
  const d = new Date(year, month - 1, 1);
  d.setDate(d.getDate() - 1);
  return formatAsInputDate(d);
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function monthToYYYYMM(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

const LS_FILTERS_KEY = "costPage:filters";
const LS_CAR_KEY = "costPage:selectedCarId";

function loadFiltersFromStorage() {
  try {
    const raw = window.localStorage.getItem(LS_FILTERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {}
  return null;
}

function saveFiltersToStorage(filters) {
  try {
    window.localStorage.setItem(LS_FILTERS_KEY, JSON.stringify(filters));
  } catch (e) {}
}

function loadCarIdFromStorage() {
  try {
    return window.localStorage.getItem(LS_CAR_KEY) || "";
  } catch (e) {
    return "";
  }
}

function saveCarIdToStorage(carId) {
  try {
    if (carId) {
      window.localStorage.setItem(LS_CAR_KEY, carId);
    } else {
      window.localStorage.removeItem(LS_CAR_KEY);
    }
  } catch (e) {}
}

const EMPTY_EDIT_FORM = {
  date: "",
  fuel_id: "",
  odometer_start: "",
  distance: "",
  received_amount: "",
  is_holiday: false,
};

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
  for (const [fuelName, color] of Object.entries(FUEL_COLOR_MAP)) {
    if (
      key === fuelName.toLowerCase() ||
      key.toLowerCase() === fuelName.toLowerCase()
    ) {
      return color;
    }
  }
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

function getFuelUnit(rawName) {
  if (!rawName) return "litr";
  const key = (rawName || "").toString().trim();
  for (const [fuelName, unit] of Object.entries(FUEL_UNIT_MAP)) {
    if (key === fuelName || key.toLowerCase() === fuelName.toLowerCase()) {
      return unit;
    }
  }
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("elektr") || lowerKey.includes("electric"))
    return "kwh";
  if (lowerKey.includes("metan") || lowerKey.includes("methane")) return "m3";
  if (
    lowerKey.includes("ai 100") ||
    lowerKey.includes("ai-100") ||
    lowerKey.includes("ai100")
  )
    return "litr";
  if (
    lowerKey.includes("ai 93") ||
    lowerKey.includes("ai-93") ||
    lowerKey.includes("ai93")
  )
    return "litr";
  if (lowerKey.includes("dizel")) return "litr";
  return "litr";
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

function extractTotals(payload) {
  const raw = pick(payload, ["totals"], null);
  return Array.isArray(raw) ? raw : [];
}

function normalizeTotal(raw, index) {
  const fuelId = pick(raw, ["fuel_id"], index);
  const fuelName = pick(raw, ["fuel_name", "name"], "Noma'lum");
  const fuelUnit = pick(raw, ["fuel_unit", "unit"], "");
  return {
    fuelId,
    fuelName: String(fuelName),
    fuelUnit: String(fuelUnit || ""),
    totalReceived: Number(pick(raw, ["total_received_amount"], 0)) || 0,
    totalExpense:
      Number(pick(raw, ["total_fuel_expence", "total_fuel_expense"], 0)) || 0,
    totalMileage: Number(pick(raw, ["total_mileage"], 0)) || 0,
    totalSum: Number(pick(raw, ["total_price_sum"], 0)) || 0,
    currentBalance:
      raw && raw.current_balance !== undefined && raw.current_balance !== null
        ? Number(raw.current_balance)
        : null,
    colorScheme: getFuelColorScheme(fuelName, index),
  };
}

function normalizeFuelType(raw, index) {
  const id = pick(raw, ["id", "_id", "uuid"], null);
  const label = pick(raw, ["name", "label", "title"], id ?? "Noma'lum");
  const unit = getFuelUnit(label);
  const price = pick(
    raw,
    ["price", "unit_price", "cost_per_unit", "price_per_unit", "narx"],
    null,
  );
  return {
    id,
    label: String(label),
    unit,
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
    name: name ? String(name) : String(label),
    plate: plate ? String(plate) : null,
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
    priceAtTime: pick(
      row,
      ["fuel_price_at_time", "price_at_time", "fuel_price"],
      null,
    ),
    normAtTime: pick(
      row,
      ["norm_per_100km_at_time", "norm_at_time", "norm_per_100km"],
      null,
    ),

    responsibleEmployee: pick(row, ["responsible_employee_at_time"], null),
    driver: pick(row, ["driver_at_time"], null),

    receivedAmount: pick(
      row,
      ["received_amount", "receivedAmount", "amount", "received"],
      null,
    ),
  };
}

function buildMonthDayRows(days) {
  const rows = [];
  (days || []).forEach((day) => {
    const dayExpenses = Array.isArray(day.expenses) ? day.expenses : [];
    if (dayExpenses.length === 0) {
      rows.push({
        __placeholder: true,
        id: null,
        date: day.date,
        fuel_id: null,
        odometer_start: pick(day, ["odometer_start"], null),
        odometer_end: pick(day, ["odometer_end"], null),
        mileage: pick(day, ["mileage"], 0),
        received_amount: null,
        is_holiday: false,
      });
    } else {
      dayExpenses.forEach((exp) => {
        rows.push({
          ...exp,
          __placeholder: false,
          date: exp.date || day.date,
          odometer_start:
            exp.odometer_start !== undefined && exp.odometer_start !== null
              ? exp.odometer_start
              : pick(day, ["odometer_start"], null),
          odometer_end:
            exp.odometer_end !== undefined && exp.odometer_end !== null
              ? exp.odometer_end
              : pick(day, ["odometer_end"], null),
          mileage:
            exp.mileage !== undefined && exp.mileage !== null
              ? exp.mileage
              : pick(day, ["mileage"], 0),
        });
      });
    }
  });
  return rows;
}

function computeTotalsFromExpenses(rows, fuelTypesById) {
  const map = {};
  rows.forEach((row) => {
    if (row.__placeholder) return;
    const fuelId = row.fuel_id;
    if (!fuelId) return;
    if (!map[fuelId]) {
      const meta = fuelTypesById[fuelId];
      map[fuelId] = {
        fuel_id: fuelId,
        fuel_name: meta?.label || row.fuel?.name || "Noma'lum",
        fuel_unit: meta?.unit || "",
        total_received_amount: 0,
        total_fuel_expence: 0,
        total_mileage: 0,
        total_price_sum: 0,
        current_balance: null,
      };
    }
    const {
      distance,
      fuelConsumed,
      sum,
      receivedAmount,
      balanceAfter,
      priceAtTime,
    } = extractComputed(row);
    const meta = fuelTypesById[fuelId];

    map[fuelId].total_received_amount += Number(receivedAmount) || 0;
    map[fuelId].total_fuel_expence += Number(fuelConsumed) || 0;
    map[fuelId].total_mileage +=
      Number(distance !== null ? distance : row.mileage) || 0;

    const price =
      priceAtTime !== null
        ? Number(priceAtTime)
        : meta?.price !== undefined && meta?.price !== null
          ? Number(meta.price)
          : null;
    const rowSum =
      sum !== null
        ? sum
        : price !== null && receivedAmount !== null
          ? Number(receivedAmount) * price
          : 0;
    map[fuelId].total_price_sum += Number(rowSum) || 0;

    if (balanceAfter !== null && balanceAfter !== undefined) {
      map[fuelId].current_balance = Number(balanceAfter);
    }
  });
  return Object.values(map);
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
    <Box position="relative" w="100%" minW="88px" flexShrink={0}>
      <NumberInput
        size={size}
        min={0}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        keepWithinRange={false}
        w="100%"
        minW="88px"
      >
        <NumberInputField
          placeholder={placeholder}
          textAlign="right"
          pr="42px"
          minW="88px"
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

function AutoCell({ value, unit }) {
  return (
    <Text color="textSecondary" fontSize="sm" cursor="default">
      {value === null || value === undefined || value === ""
        ? "—"
        : `${formatNumber(value)}${unit ? ` ${unit}` : ""}`}
    </Text>
  );
}

function EstimatedCell({ value, unit }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(value)
  ) {
    return <AutoCell value={null} />;
  }
  return (
    <Text color="text" fontSize="sm" fontWeight="semibold" cursor="default">
      {formatNumber(value)}
      {unit ? ` ${unit}` : ""}
    </Text>
  );
}

function FuelBadge({ fuelId, fuelTypesById, fallback }) {
  let meta = fuelTypesById[fuelId];
  if (!meta && fallback) {
    meta = {
      label: fallback.name || fuelId || "—",
      colorScheme: getFuelColorScheme(fallback.name, 0),
    };
  }
  if (!meta) {
    meta = { label: fuelId || "—", colorScheme: "neutral" };
  }
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

function HolidayBadge({ isHoliday }) {
  return isHoliday ? (
    <Badge
      colorScheme="green"
      variant="subtle"
      borderRadius="md"
      px={2}
      py={0.5}
    >
      Ha
    </Badge>
  ) : (
    <Badge
      colorScheme="gray"
      variant="subtle"
      borderRadius="md"
      px={2}
      py={0.5}
    >
      Yo'q
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
  fuelTypes,
  fuelTypesLoading,
  leading,
  trailing,
}) {
  return (
    <Flex direction="row" gap={3} wrap="wrap" align="center">
      {leading}
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
      <Select
        value={filters.year}
        onChange={(e) => onChange({ year: Number(e.target.value) })}
        maxW="110px"
        size="sm"
        {...inputStyles}
      >
        {getYearOptions().map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Select
        value={filters.month}
        onChange={(e) => onChange({ month: Number(e.target.value) })}
        maxW="150px"
        size="sm"
        {...inputStyles}
      >
        {MONTH_NAMES_UZ.map((name, idx) => (
          <option key={idx + 1} value={idx + 1}>
            {name}
          </option>
        ))}
      </Select>
      {trailing}
    </Flex>
  );
}

function CarPickerSelect({ cars, selectedCarId, onCarChange, carsLoading }) {
  if (carsLoading) {
    return <Skeleton h="38px" w="260px" borderRadius="lg" flexShrink={0} />;
  }
  return (
    <HStack
      spacing={0}
      flex="0 0 auto"
      w="260px"
      borderWidth="1px"
      borderColor={selectedCarId ? "primary.400" : "border"}
      borderRadius="lg"
      overflow="hidden"
      bg="surface"
      transition="all 0.2s ease"
      _hover={{ borderColor: "primary.400" }}
      _focusWithin={{
        borderColor: "primary.500",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.15)",
      }}
    >
      <Center boxSize="38px" bg="primary.500" color="white" flexShrink={0}>
        <Car size={18} />
      </Center>
      <Select
        value={selectedCarId}
        onChange={(e) => onCarChange(e.target.value)}
        size="sm"
        h="38px"
        border="none"
        borderRadius="0"
        placeholder="Mashinani tanlang"
        bg="transparent"
        color="text"
        fontWeight="600"
        _focus={{ boxShadow: "none" }}
        _hover={{}}
      >
        {cars.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
            {c.odometer !== null ? ` — ${formatNumber(c.odometer)} km` : ""}
          </option>
        ))}
      </Select>
    </HStack>
  );
}

function parsePlate(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const match = str.match(/^(\d{2})\s*[-\s]?\s*(.+)$/);
  if (match) {
    return { region: match[1], rest: match[2].trim().toUpperCase() };
  }
  return { region: null, rest: str.toUpperCase() };
}

function PlateNumber({ plate, size = "sm" }) {
  const parsed = parsePlate(plate);
  const isSmall = size === "sm";
  if (!parsed) {
    return (
      <Text fontSize="xs" color="textSecondary">
        Raqam kiritilmagan
      </Text>
    );
  }
  return (
    <HStack
      spacing={0}
      bg="white"
      borderRadius="6px"
      borderWidth="1.5px"
      borderColor="gray.900"
      overflow="hidden"
      boxShadow="sm"
      h={isSmall ? "24px" : "30px"}
      w="fit-content"
      flexShrink={0}
    >
      {parsed.region && (
        <Center
          px={2}
          h="100%"
          borderRightWidth="2px"
          borderRightColor="gray.900"
        >
          <Text
            fontSize={isSmall ? "11px" : "13px"}
            fontWeight="800"
            color="gray.900"
            lineHeight="1"
          >
            {parsed.region}
          </Text>
        </Center>
      )}
      <Center px={2} h="100%">
        <Text
          fontSize={isSmall ? "11px" : "13px"}
          fontWeight="800"
          color="gray.900"
          letterSpacing="0.5px"
          lineHeight="1"
          whiteSpace="nowrap"
        >
          {parsed.rest}
        </Text>
      </Center>
      <Flex
        direction="column"
        align="center"
        justify="center"
        bg="blue.600"
        px={1}
        h="100%"
      >
        <Text fontSize="6px" fontWeight="800" color="white" lineHeight="1.1">
          UZ
        </Text>
      </Flex>
    </HStack>
  );
}

function CarCard({ car, isSelected, onClick }) {
  const selectedBg = useColorModeValue(
    "rgba(59,130,246,0.06)",
    "rgba(59,130,246,0.12)",
  );
  const ringShadow = useColorModeValue(
    "0 0 0 3px rgba(59,130,246,0.14)",
    "0 0 0 3px rgba(59,130,246,0.28)",
  );
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      textAlign="left"
      position="relative"
      bg={isSelected ? selectedBg : "surface"}
      borderWidth="0"
      borderRadius="lg"
      px={3.5}
      py={2.5}
      w="196px"
      flex="0 0 196px"
      transition="all 0.18s ease"
      boxShadow={isSelected ? ringShadow : "sm"}
      _hover={{
        borderColor: "primary.400",
        transform: "translateY(-2px)",
        boxShadow: "md",
      }}
      _active={{ transform: "translateY(0)" }}
    >
      {isSelected && (
        <Center
          position="absolute"
          top="-7px"
          right="-7px"
          boxSize="18px"
          bg="primary.500"
          color="white"
          borderRadius="full"
          boxShadow="0 2px 6px rgba(0,0,0,0.25)"
        >
          <Check size={11} strokeWidth={3} />
        </Center>
      )}
      <HStack spacing={2.5} align="center">
        <Center
          boxSize="30px"
          borderRadius="md"
          bg={isSelected ? "primary.500" : "bg"}
          color={isSelected ? "white" : "textSecondary"}
          flexShrink={0}
          borderWidth={isSelected ? "0" : "1px"}
          borderColor="border"
          transition="all 0.18s ease"
        >
          <Car size={15} />
        </Center>
        <Text
          fontWeight="bold"
          fontSize="sm"
          color="text"
          noOfLines={1}
          title={car.name}
        >
          {car.name}
        </Text>
      </HStack>
      <Box mt={2.5} />
      <HStack justify="flex-start" align="center">
        <PlateNumber plate={car.plate} />
      </HStack>
    </Box>
  );
}

function CarCardsGrid({ cars, selectedCarId, onCarChange, carsLoading }) {
  if (carsLoading) {
    return (
      <Flex gap={3} wrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} h="80px" w="196px" borderRadius="lg" />
        ))}
      </Flex>
    );
  }
  if (cars.length === 0) {
    return (
      <Text color="textSecondary" fontSize="sm">
        Mashinalar topilmadi
      </Text>
    );
  }
  return (
    <Flex gap={5} wrap="wrap">
      {cars.map((car) => (
        <CarCard
          key={car.id}
          car={car}
          isSelected={selectedCarId === car.id}
          onClick={() => onCarChange(car.id)}
        />
      ))}
    </Flex>
  );
}

function CarSelector({
  filters,
  onFilterChange,
  fuelTypes,
  fuelTypesLoading,
  cars,
  carsLoading,
  selectedCarId,
  onCarChange,
  showCards,
  onExportExcel,
  isExporting,
}) {
  return (
    <Box w="100%">
      <Box
        bg="surface"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        boxShadow="md"
        px={{ base: 5, md: 8 }}
        py={4}
        mb={showCards ? 4 : 0}
        w="100%"
      >
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          fuelTypes={fuelTypes}
          fuelTypesLoading={fuelTypesLoading}
          leading={
            !showCards ? (
              <CarPickerSelect
                cars={cars}
                selectedCarId={selectedCarId}
                onCarChange={onCarChange}
                carsLoading={carsLoading}
              />
            ) : null
          }
          trailing={
            <Button
              leftIcon={<Download size={14} />}
              size="sm"
              variant="outline"
              colorScheme="green"
              borderRadius="md"
              onClick={onExportExcel}
              isLoading={isExporting}
              isDisabled={!selectedCarId}
            >
              Excel yuklash
            </Button>
          }
        />
      </Box>
      {showCards && (
        <Box mt={4}>
          <CarCardsGrid
            cars={cars}
            selectedCarId={selectedCarId}
            onCarChange={onCarChange}
            carsLoading={carsLoading}
          />
        </Box>
      )}
    </Box>
  );
}

// Oyning har bir "bo'sh" (xarajatsiz) kuni uchun to'g'ridan-to'g'ri jadval
// qatorida kiritish formasi.
// MUHIM: yoqilg'i turi endi avtomatik tanlanmaydi — foydalanuvchi
// "Yoqilg'ini tanlang" placeholder orqali o'zi tanlashi kerak.
// Qoldiq (balans) shu QATORNING SANASIGA mos ravishda, o'sha kungacha bo'lgan
// haqiqiy (tarixiy) qoldiqdan hisoblanadi — global "eng oxirgi" qoldiqdan
// emas (balancesByFuelId orqali parent komponentda tayyorlanadi).
//
// MUHIM TUZATISH: qoldiqni hisoblash uchun "editForm" emas, balki shu
// komponentning O'ZINING lokal state'lari (fuelId, receivedAmount)
// ishlatilishi kerak — bu yerda editForm degan narsa umuman mavjud emas.
// Bu xato tufayli "yoqilg'i quyilmagan (received_amount bo'sh), lekin
// yurgan km kiritilgan" holatda komponent qoldiqni butunlay ko'rsatmay
// qo'ygan edi. Endi received_amount bo'sh bo'lsa ham (0 deb olinadi),
// fuel turi tanlangan va km kiritilgan bo'lsa — qoldiq to'g'ri chiqadi.
function DayEntryRow({
  row,
  idx,
  onAdd,
  isSaving,
  fuelTypes,
  fuelTypesLoading,
  fuelTypesById,
  disabled,
  selectedCarId,
  normRatesByFuelId,
  balancesByFuelId,
  initialBalancesByFuelId, // new prop
}) {
  const [fuelId, setFuelId] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [distance, setDistance] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);

  const rowBaseBg = idx % 2 === 1 ? "bg" : "surface";
  const fuelMeta = fuelId ? fuelTypesById?.[fuelId] : null;
  const selectedUnit = fuelId ? fuelMeta?.unit || "litr" : "";

  // Tanlangan yoqilg'i turiga tegishli, SHU KUNGACHA bo'lgan qoldiq.
  // Avval balancesByFuelId dan olamiz (bu oy ichidagi oldingi yozuvlar asosida),
  // agar u null yoki 0 bo'lsa, initialBalancesByFuelId dan olamiz (oxirgi umumiy qoldiq).
  let lastBalance = null;
  if (fuelId) {
    const fromRow =
      balancesByFuelId && balancesByFuelId[fuelId] !== undefined
        ? balancesByFuelId[fuelId]
        : null;
    if (fromRow !== null && fromRow !== 0) {
      lastBalance = fromRow;
    } else {
      // fallback to initial balance (latest overall)
      const fromInit =
        initialBalancesByFuelId && initialBalancesByFuelId[fuelId] !== undefined
          ? initialBalancesByFuelId[fuelId]
          : null;
      if (fromInit !== null && fromInit !== 0) {
        lastBalance = fromInit;
      } else {
        // still null? then use 0
        lastBalance = 0;
      }
    }
  }

  const estimatedSum =
    fuelId && fuelMeta?.price && receivedAmount !== ""
      ? Number(receivedAmount) * Number(fuelMeta.price)
      : null;
  const hasDistance = distance !== "";
  const odometerStart =
    row.odometer_start !== null && row.odometer_start !== undefined
      ? row.odometer_start
      : "";
  const computedOdometerEnd =
    odometerStart !== "" && hasDistance
      ? Number(odometerStart) + Number(distance)
      : null;
  const normRate =
    fuelId && normRatesByFuelId && normRatesByFuelId[fuelId] !== undefined
      ? normRatesByFuelId[fuelId]
      : null;
  const estimatedFuelConsumed =
    normRate !== null && hasDistance
      ? (Number(distance) * normRate) / 100
      : null;

  // receivedAmount bo'sh bo'lsa 0 deb olinadi
  const computedBalanceAfter =
    fuelId && lastBalance !== null && hasDistance
      ? Number(lastBalance) +
        (receivedAmount === "" ? 0 : Number(receivedAmount)) -
        (estimatedFuelConsumed || 0)
      : null;

  const isValid = !disabled && !!fuelId && odometerStart !== "" && hasDistance;

  const handleAdd = () => {
    if (!fuelId) return;
    onAdd(row.date, {
      fuel_id: fuelId,
      odometer_start: odometerStart,
      distance,
      received_amount: receivedAmount,
      is_holiday: isHoliday,
    });
  };

  return (
    <Tr bg={rowBaseBg} borderBottomWidth="1px" borderColor="border">
      <Td fontWeight="semibold" color="text" borderColor="border" py={3.5}>
        {formatDate(row.date)}
      </Td>
      <Td borderColor="border">
        {fuelTypesLoading ? (
          <Skeleton h="32px" borderRadius="md" />
        ) : (
          <Select
            size="sm"
            value={fuelId}
            onChange={(e) => setFuelId(e.target.value)}
            isDisabled={disabled || isSaving}
            placeholder="Yoqilg'ini tanlang"
            {...inputStyles}
          >
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
          value={receivedAmount}
          onChange={(val) => setReceivedAmount(val)}
          isDisabled={disabled || isSaving || !fuelId}
          unit={selectedUnit}
          size="sm"
        />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={estimatedFuelConsumed} unit={selectedUnit} />
      </Td>
      <Td isNumeric borderColor="border">
        <AutoCell value={odometerStart} unit="km" />
      </Td>
      <Td isNumeric borderColor="border">
        <AutoCell value={computedOdometerEnd} unit="km" />
      </Td>
      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={distance}
          onChange={(val) => setDistance(val)}
          isDisabled={disabled || isSaving || !fuelId}
          unit="km"
          size="sm"
        />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={estimatedSum} unit="so'm" />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={computedBalanceAfter} unit={selectedUnit} />
      </Td>
      <Td borderColor="border">
        <HStack spacing={2}>
          <Switch
            size="sm"
            isChecked={isHoliday}
            onChange={(e) => setIsHoliday(e.target.checked)}
            colorScheme="accent"
            isDisabled={disabled || isSaving}
          />
          <Text fontSize="xs" color="textSecondary" whiteSpace="nowrap">
            Dam olish
          </Text>
        </HStack>
      </Td>
      <Td borderColor="border">
        <IconButton
          aria-label="Saqlash"
          icon={<Plus size={16} />}
          size="sm"
          colorScheme="primary"
          borderRadius="md"
          onClick={handleAdd}
          isDisabled={disabled || !isValid}
          isLoading={isSaving}
        />
      </Td>
    </Tr>
  );
}

// Mavjud yozuvni tahrirlash qatori. Yoqilg'i turi Select orqali
// o'zgartiriladi va qoldiq shu QATORNING SANASIGACHA (undan oldin)
// bo'lgan haqiqiy qoldiqqa mos ravishda hisoblanadi (balancesByFuelId
// orqali — bu qator o'zining ta'siridan OLDINGI holatni ifodalaydi).
//
// TUZATISH: avval qoldiq faqat "received_amount" to'ldirilgan bo'lsagina
// hisoblanardi. Endi received_amount bo'sh bo'lsa 0 deb olinadi — shunda
// yoqilg'i quyilmasdan, faqat km kiritilgan holatda ham qoldiq to'g'ri
// ko'rsatiladi va saqlash tugmasi ham shunga mos ishlaydi.
function EditRowInline({
  editForm,
  onChange,
  onSave,
  onCancel,
  isSaving,
  fuelTypesById,
  fuelTypes,
  fuelTypesLoading,
  selectedCarId,
  normRatesByFuelId,
  balancesByFuelId,
  initialBalancesByFuelId, // new prop
}) {
  const rowBg = useColorModeValue("accent.50", "whiteAlpha.150");
  const rowBorder = useColorModeValue("accent.100", "whiteAlpha.300");
  const hasDistance = editForm.distance !== "";
  const computedOdometerEnd =
    editForm.odometer_start !== "" && hasDistance
      ? Number(editForm.odometer_start) + Number(editForm.distance)
      : null;
  const isValid =
    editForm.fuel_id !== "" && editForm.odometer_start !== "" && hasDistance;
  const fuelMeta = editForm.fuel_id ? fuelTypesById[editForm.fuel_id] : null;
  const selectedUnit = editForm.fuel_id ? fuelMeta?.unit || "litr" : "";
  const estimatedSum =
    editForm.fuel_id && fuelMeta?.price && editForm.received_amount !== ""
      ? Number(editForm.received_amount) * Number(fuelMeta.price)
      : null;
  const normRate =
    editForm.fuel_id &&
    normRatesByFuelId &&
    normRatesByFuelId[editForm.fuel_id] !== undefined
      ? normRatesByFuelId[editForm.fuel_id]
      : null;
  const estimatedFuelConsumed =
    normRate !== null && hasDistance
      ? (Number(editForm.distance) * normRate) / 100
      : null;

  // Tanlangan yoqilg'i turiga tegishli, ushbu yozuvning sanasigacha (undan
  // oldingi) bo'lgan qoldiq.
  let lastBalance = null;
  if (editForm.fuel_id) {
    const fromRow =
      balancesByFuelId && balancesByFuelId[editForm.fuel_id] !== undefined
        ? balancesByFuelId[editForm.fuel_id]
        : null;
    if (fromRow !== null && fromRow !== 0) {
      lastBalance = fromRow;
    } else {
      const fromInit =
        initialBalancesByFuelId &&
        initialBalancesByFuelId[editForm.fuel_id] !== undefined
          ? initialBalancesByFuelId[editForm.fuel_id]
          : null;
      if (fromInit !== null && fromInit !== 0) {
        lastBalance = fromInit;
      } else {
        lastBalance = 0;
      }
    }
  }

  const computedBalanceAfter =
    editForm.fuel_id && lastBalance !== null && hasDistance
      ? Number(lastBalance) +
        (editForm.received_amount === ""
          ? 0
          : Number(editForm.received_amount)) -
        (estimatedFuelConsumed || 0)
      : null;

  return (
    <Tr bg={rowBg} borderBottomWidth="1px" borderColor={rowBorder}>
      <Td fontWeight="semibold" color="text" borderColor="border" py={3.5}>
        {formatDate(editForm.date)}
      </Td>
      <Td borderColor="border">
        {fuelTypesLoading ? (
          <Skeleton h="32px" borderRadius="md" />
        ) : (
          <Select
            size="sm"
            value={editForm.fuel_id}
            onChange={(e) => onChange({ fuel_id: e.target.value })}
            isDisabled={isSaving}
            placeholder="Yoqilg'ini tanlang"
            {...inputStyles}
          >
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
          value={editForm.received_amount}
          onChange={(val) => onChange({ received_amount: val })}
          isDisabled={isSaving || !editForm.fuel_id}
          unit={selectedUnit}
          size="sm"
        />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={estimatedFuelConsumed} unit={selectedUnit} />
      </Td>
      <Td isNumeric borderColor="border">
        <AutoCell value={editForm.odometer_start} unit="km" />
      </Td>
      <Td isNumeric borderColor="border">
        <AutoCell value={computedOdometerEnd} unit="km" />
      </Td>
      <Td isNumeric borderColor="border">
        <UnitNumberInput
          value={editForm.distance}
          onChange={(val) => onChange({ distance: val })}
          isDisabled={isSaving || !editForm.fuel_id}
          unit="km"
          size="sm"
        />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={estimatedSum} unit="so'm" />
      </Td>
      <Td isNumeric borderColor="border">
        <EstimatedCell value={computedBalanceAfter} unit={selectedUnit} />
      </Td>
      <Td borderColor="border">
        <HStack spacing={2}>
          <Switch
            size="sm"
            isChecked={editForm.is_holiday}
            onChange={(e) => onChange({ is_holiday: e.target.checked })}
            colorScheme="accent"
            isDisabled={isSaving}
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
  const {
    distance,
    fuelConsumed,
    sum,
    balanceAfter,
    priceAtTime,
    normAtTime,
    responsibleEmployee,
    driver,
  } = extractComputed(row);

  const fuelMeta = fuelTypesById[row.fuel_id] || row.fuel || null;
  const fuelUnit = row.fuel_unit || fuelMeta?.unit || "litr";

  const effectivePrice =
    priceAtTime !== null
      ? Number(priceAtTime)
      : fuelMeta?.price !== undefined && fuelMeta?.price !== null
        ? Number(fuelMeta.price)
        : null;

  const displaySum =
    sum !== null
      ? sum
      : effectivePrice !== null &&
          row.received_amount !== undefined &&
          row.received_amount !== null
        ? Number(row.received_amount) * effectivePrice
        : null;

  const showActions = editingId === null;

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
        <FuelBadge
          fuelId={row.fuel_id}
          fuelTypesById={fuelTypesById}
          fallback={row.fuel}
        />
      </Td>
      <Td isNumeric color="text" borderColor="border">
        {formatNumber(row.received_amount)} {fuelUnit}
      </Td>
      <Td isNumeric color="textSecondary" borderColor="border">
        <AutoCell value={fuelConsumed} unit={fuelUnit} />
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
            ? `${formatNumber(Number(row.odometer_end) - Number(row.odometer_start))} km`
            : "—"}
      </Td>
      <Td isNumeric fontWeight="bold" color="text" borderColor="border">
        <AutoCell value={displaySum} unit="so'm" />
      </Td>
      <Td isNumeric color="textSecondary" borderColor="border">
        <AutoCell value={balanceAfter} unit={fuelUnit} />
      </Td>
      <Td borderColor="border">
        <HolidayBadge isHoliday={row.is_holiday} />
      </Td>
      <Td borderColor="border">
        {showActions ? (
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
        ) : (
          <Text color="textSecondary" fontSize="xs" textAlign="center">
            —
          </Text>
        )}
      </Td>
    </Tr>
  );
}

function TotalsSummaryTable({ totals }) {
  if (!totals || totals.length === 0) return null;

  const grandTotal = totals.reduce(
    (acc, t) => ({
      received: acc.received + (Number(t.totalReceived) || 0),
      expense: acc.expense + (Number(t.totalExpense) || 0),
      mileage: acc.mileage + (Number(t.totalMileage) || 0),
      sum: acc.sum + (Number(t.totalSum) || 0),
    }),
    { received: 0, expense: 0, mileage: 0, sum: 0 },
  );

  return (
    <Box
      bg="surface"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border"
      boxShadow="md"
      overflow="hidden"
      w="100%"
    >
      <Box px={5} pt={4} pb={2}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="textSecondary"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Jami statistika
        </Text>
      </Box>
      <TableContainer w="100%" overflowX="visible">
        <Table variant="simple" size="sm" w="100%">
          <Thead bg="bg">
            <Tr>
              <Th color="textSecondary" borderColor="border">
                Yoqilg'i
              </Th>
              <Th color="textSecondary" borderColor="border" isNumeric>
                Olingan
              </Th>
              <Th color="textSecondary" borderColor="border" isNumeric>
                Sarflangan
              </Th>
              <Th color="textSecondary" borderColor="border" isNumeric>
                Yurgan
              </Th>
              <Th color="textSecondary" borderColor="border" isNumeric>
                Summa
              </Th>
              <Th color="textSecondary" borderColor="border" isNumeric>
                Qoldiq
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr bg="primaryBg" _hover={{ bg: "primaryBg" }}>
              <Td
                borderColor="border"
                borderLeftWidth="4px"
                borderLeftColor="primary.500"
              >
                <Text fontWeight="extrabold" color="text" fontSize="sm">
                  Jami
                </Text>
              </Td>
              <Td
                isNumeric
                borderColor="border"
                fontWeight="extrabold"
                color="text"
              >
                {formatNumber(grandTotal.received)}
              </Td>
              <Td
                isNumeric
                borderColor="border"
                fontWeight="extrabold"
                color="text"
              >
                {formatNumber(grandTotal.expense)}
              </Td>
              <Td
                isNumeric
                borderColor="border"
                fontWeight="extrabold"
                color="text"
              >
                {formatNumber(grandTotal.mileage)} km
              </Td>
              <Td
                isNumeric
                borderColor="border"
                fontWeight="extrabold"
                color="text"
              >
                {formatNumber(grandTotal.sum)} so'm
              </Td>
              <Td isNumeric borderColor="border">
                <Badge
                  colorScheme="primary"
                  borderRadius="md"
                  px={2}
                  py={0.5}
                  fontWeight="bold"
                >
                  {totals.length} turi
                </Badge>
              </Td>
            </Tr>
            {totals.map((total) => {
              const hasBalance =
                total.currentBalance !== null &&
                !Number.isNaN(total.currentBalance);
              const balancePositive = hasBalance && total.currentBalance >= 0;

              return (
                <Tr key={total.fuelId} _hover={{ bg: "primaryBg" }}>
                  <Td
                    borderColor="border"
                    borderLeftWidth="4px"
                    borderLeftColor={`${total.colorScheme}.500`}
                  >
                    <Badge
                      colorScheme={total.colorScheme}
                      borderRadius="md"
                      px={2.5}
                      py={1}
                      fontWeight="bold"
                    >
                      {total.fuelName}
                    </Badge>
                  </Td>
                  <Td
                    isNumeric
                    borderColor="border"
                    fontWeight="semibold"
                    color="text"
                  >
                    {formatNumber(total.totalReceived)} {total.fuelUnit}
                  </Td>
                  <Td
                    isNumeric
                    borderColor="border"
                    fontWeight="semibold"
                    color="text"
                  >
                    {formatNumber(total.totalExpense)} {total.fuelUnit}
                  </Td>
                  <Td
                    isNumeric
                    borderColor="border"
                    fontWeight="semibold"
                    color="text"
                  >
                    {formatNumber(total.totalMileage)} km
                  </Td>
                  <Td
                    isNumeric
                    borderColor="border"
                    fontWeight="semibold"
                    color="text"
                  >
                    {formatNumber(total.totalSum)} so'm
                  </Td>
                  <Td isNumeric borderColor="border">
                    {hasBalance ? (
                      <HStack
                        spacing={1}
                        justify="flex-end"
                        bg={balancePositive ? "green.500" : "red.500"}
                        borderRadius="md"
                        px={2}
                        py={1}
                        display="inline-flex"
                      >
                        {balancePositive ? (
                          <TrendingUp size={12} color="white" />
                        ) : (
                          <TrendingDown size={12} color="white" />
                        )}
                        <Text fontSize="xs" fontWeight="bold" color="white">
                          {formatNumber(total.currentBalance)} {total.fuelUnit}
                        </Text>
                      </HStack>
                    ) : (
                      <Text color="textSecondary" fontSize="sm">
                        —
                      </Text>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function ExpenseTable({
  items,
  loading,
  fuelTypesById,
  noCarSelected,
  onAddForDate,
  savingDate,
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
  normRatesByFuelId,
  balanceBeforeByRow,
  initialBalancesByFuelId, // new prop
}) {
  if (noCarSelected) {
    return <NoCarState />;
  }

  const header = (
    <Thead bg="bg" position="sticky" top={0} zIndex={1}>
      <Tr>
        <Th color="textSecondary" borderColor="border" py={4} w="8%">
          Sana
        </Th>
        <Th color="textSecondary" borderColor="border" w="9%">
          Yoqilg'i
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="11%">
          Olingan
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="8%">
          Sarflangan
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="7%">
          Spidometr (boshi)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="7%">
          Spidometr (oxiri)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="10%">
          Yurgan (km)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="10%">
          Summa (so'm)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric w="9%">
          Qoldiq
        </Th>
        <Th color="textSecondary" borderColor="border" w="13%">
          Holat
        </Th>
        <Th borderColor="border" w="8%">
          Amallar
        </Th>
      </Tr>
    </Thead>
  );

  const renderRow = (row, idx) => {
    const rowKey = row.__placeholder ? `placeholder-${row.date}` : row.id;
    const rowBalances =
      (balanceBeforeByRow && balanceBeforeByRow[rowKey]) || {};

    if (row.__placeholder) {
      return (
        <DayEntryRow
          key={`empty-${row.date}`}
          row={row}
          idx={idx}
          onAdd={onAddForDate}
          isSaving={savingDate === row.date}
          fuelTypes={fuelTypes}
          fuelTypesLoading={fuelTypesLoading}
          fuelTypesById={fuelTypesById}
          disabled={
            noCarSelected || (savingDate !== null && savingDate !== row.date)
          }
          selectedCarId={selectedCarId}
          normRatesByFuelId={normRatesByFuelId}
          balancesByFuelId={rowBalances}
          initialBalancesByFuelId={initialBalancesByFuelId}
        />
      );
    }
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
          fuelTypes={fuelTypes}
          fuelTypesLoading={fuelTypesLoading}
          selectedCarId={selectedCarId}
          normRatesByFuelId={normRatesByFuelId}
          balancesByFuelId={rowBalances}
          initialBalancesByFuelId={initialBalancesByFuelId}
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
    <TableContainer w="100%" overflowX="visible">
      <Table
        variant="simple"
        size="sm"
        w="100%"
        sx={{
          tableLayout: "fixed",
          "& th": {
            paddingInlineStart: "8px",
            paddingInlineEnd: "8px",
            whiteSpace: "normal",
          },
          "& td": {
            paddingInlineStart: "6px",
            paddingInlineEnd: "6px",
            paddingTop: "6px",
            paddingBottom: "6px",
          },
        }}
      >
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
      isCentered
    >
      <AlertDialogOverlay bg="blackAlpha.400" backdropFilter="blur(3px)">
        <AlertDialogContent borderRadius="xl" bg="surface" boxShadow="2xl">
          <AlertDialogHeader
            bg="surfBlur"
            borderTopRadius="xl"
            borderBottom="1px solid"
            borderColor="border"
            fontSize="lg"
            color="text"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <AlertTriangle size={18} color="var(--chakra-colors-red-500)" />
            O'chirishni tasdiqlang
          </AlertDialogHeader>
          <AlertDialogBody bg="bg" py={4}>
            <Text color="text">
              Siz rostdan ham{" "}
              <Text as="span" fontWeight="700">
                {target ? formatDate(target.date) : ""}
              </Text>{" "}
              sanadagi yoqilg'i ma'lumotini o'chirmoqchimisiz?
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
              ref={cancelRef}
              size="sm"
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onClose}
              isDisabled={isDeleting}
            >
              Bekor qilish
            </Button>
            <Button
              size="sm"
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
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
  month: getCurrentMonth(),
  year: getCurrentYear(),
  sortBy: "date",
  sortOrder: "ASC",
};

function CostPage() {
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState(() =>
    loadCarIdFromStorage(),
  );
  const [showCards, setShowCards] = useState(false);

  const loadCars = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setCarsLoading(true);
    try {
      const response = await apiCars.All(
        1,
        100,
        "",
        true,
        false,
        "",
        "",
        "name",
        "ASC",
      );
      const raw = extractList(response?.data);
      const normalized = raw.map(normalizeCar);
      setCars(normalized);
      setSelectedCarId((prev) => {
        if (prev && normalized.some((c) => c.id === prev)) return prev;
        if (!prev && normalized.length === 1) return normalized[0].id;
        if (prev && !normalized.some((c) => c.id === prev)) return "";
        return prev;
      });
    } catch (err) {
      if (!isNotFoundError(err)) {
        toastService.error(
          "Mashinalar ro'yxatini yuklab bo'lmadi: " + err.message,
        );
      }
      setCars([]);
    } finally {
      if (!silent) setCarsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  useEffect(() => {
    saveCarIdToStorage(selectedCarId);
  }, [selectedCarId]);

  const [filters, setFilters] = useState(() => {
    const stored = loadFiltersFromStorage();
    return stored ? { ...DEFAULT_FILTERS, ...stored } : DEFAULT_FILTERS;
  });

  const [rawDays, setRawDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [fuelTypesLoading, setFuelTypesLoading] = useState(true);

  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

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
      if (!isNotFoundError(err)) {
        toastService.error(
          "Yoqilg'i turlarini yuklab bo'lmadi: " + err.message,
        );
      }
      setFuelTypes([]);
    } finally {
      setFuelTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFuelTypes();
  }, [loadFuelTypes]);

  const [savingDate, setSavingDate] = useState(null);

  const isCurrentMonthSelected =
    filters.year === getCurrentYear() && filters.month === getCurrentMonth();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialog = useDisclosure();

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleCarChange = (id) => {
    setSelectedCarId(id);
    setRawDays([]);
    setEditingId(null);
  };

  const loadExpenses = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!selectedCarId || carsLoading) {
        setRawDays([]);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const month = monthToYYYYMM(filters.year, filters.month);
        const data = await apiCost.CarMonthlyReport(
          selectedCarId,
          month,
          filters.fuel_id || undefined,
        );
        const days = pick(data, ["days"], []);
        setRawDays(days);
      } catch (err) {
        if (!isNotFoundError(err)) {
          toastService.error("Ro'yxatni yuklab bo'lmadi: " + err.message);
        }
        setRawDays([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedCarId, filters.year, filters.month, filters.fuel_id, carsLoading],
  );

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const expenses = useMemo(() => {
    const rows = buildMonthDayRows(rawDays);
    rows.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return filters.sortOrder === "DESC" ? db - da : da - db;
    });
    return rows;
  }, [rawDays, filters.sortOrder]);

  const totals = useMemo(() => {
    const totalsRaw = computeTotalsFromExpenses(expenses, fuelTypesById);
    return totalsRaw.map(normalizeTotal);
  }, [expenses, fuelTypesById]);

  const [normRatesByFuelId, setNormRatesByFuelId] = useState({});
  const [normRatesLoading, setNormRatesLoading] = useState(false);

  const loadNormRates = useCallback(async () => {
    if (!selectedCarId || carsLoading || fuelTypes.length === 0) {
      setNormRatesByFuelId({});
      return;
    }
    setNormRatesLoading(true);
    try {
      const entries = await Promise.all(
        fuelTypes.map(async (f) => {
          try {
            const response = await apiCars.AllNorms(1, 1, selectedCarId, f.id);
            const list = extractList(response?.data);
            const normRaw = list[0];
            if (!normRaw) return [f.id, null];
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
            return [f.id, r !== null ? Number(r) : null];
          } catch (e) {
            return [f.id, null];
          }
        }),
      );
      setNormRatesByFuelId(Object.fromEntries(entries));
    } catch (e) {
      setNormRatesByFuelId({});
    } finally {
      setNormRatesLoading(false);
    }
  }, [selectedCarId, fuelTypes, carsLoading]);

  useEffect(() => {
    loadNormRates();
  }, [loadNormRates]);

  const carFuelTypes = useMemo(() => {
    if (!selectedCarId) return fuelTypes;
    const assigned = fuelTypes.filter(
      (f) =>
        normRatesByFuelId[f.id] !== null &&
        normRatesByFuelId[f.id] !== undefined,
    );
    if (assigned.length > 0) return assigned;
    return fuelTypes;
  }, [fuelTypes, normRatesByFuelId, selectedCarId]);

  // Initial balances (latest overall) for each fuel
  const [initialBalancesByFuelId, setInitialBalancesByFuelId] = useState({});
  const [initialBalancesLoading, setInitialBalancesLoading] = useState(false);

  const loadInitialBalances = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!selectedCarId || carsLoading || fuelTypes.length === 0) {
        setInitialBalancesByFuelId({});
        return;
      }
      if (!silent) setInitialBalancesLoading(true);
      try {
        const today = getTodayDate();
        const entries = await Promise.all(
          fuelTypes.map(async (f) => {
            try {
              const response = await apiCost.All(1, 1, {
                car_id: selectedCarId,
                fuel_id: f.id,
                date_to: today,
                sortBy: "date",
                sortOrder: "DESC",
              });
              const list = extractList(response);
              if (list.length > 0) {
                const computed = extractComputed(list[0]);
                return [
                  f.id,
                  computed.balanceAfter !== null
                    ? Number(computed.balanceAfter)
                    : 0,
                ];
              }
              return [f.id, 0];
            } catch (e) {
              if (isNotFoundError(e)) return [f.id, 0];
              return [f.id, null];
            }
          }),
        );
        setInitialBalancesByFuelId(Object.fromEntries(entries));
      } catch (e) {
        setInitialBalancesByFuelId({});
      } finally {
        if (!silent) setInitialBalancesLoading(false);
      }
    },
    [selectedCarId, fuelTypes, carsLoading],
  );

  useEffect(() => {
    loadInitialBalances();
  }, [loadInitialBalances]);

  // Tanlangan OYDAN OLDINGI (bazaviy) qoldiq — har bir yoqilg'i turi
  // uchun alohida. Bu faqat oy ichidagi birinchi yozuv uchun "urug'"
  // (seed) sifatida ishlatiladi; oy ichidagi keyingi kunlar uchun
  // qoldiq quyidagi balanceBeforeByRow orqali ketma-ket hisoblanadi.
  const [lastBalanceByFuelId, setLastBalanceByFuelId] = useState({});
  const [lastBalancesLoading, setLastBalancesLoading] = useState(false);

  const loadLastBalances = useCallback(
    async (opts = {}) => {
      const { silent = false } = opts;
      if (!selectedCarId || carsLoading || fuelTypes.length === 0) {
        setLastBalanceByFuelId({});
        return;
      }
      if (!silent) setLastBalancesLoading(true);
      try {
        const dateTo = getDayBeforeMonthStart(filters.year, filters.month);
        const entries = await Promise.all(
          fuelTypes.map(async (f) => {
            try {
              const response = await apiCost.All(1, 1, {
                car_id: selectedCarId,
                fuel_id: f.id,
                date_to: dateTo,
                sortBy: "date",
                sortOrder: "DESC",
              });
              const list = extractList(response);
              if (list.length > 0) {
                const computed = extractComputed(list[0]);
                return [
                  f.id,
                  computed.balanceAfter !== null
                    ? Number(computed.balanceAfter)
                    : 0,
                ];
              }
              return [f.id, 0];
            } catch (e) {
              if (isNotFoundError(e)) return [f.id, 0];
              return [f.id, null];
            }
          }),
        );
        setLastBalanceByFuelId(Object.fromEntries(entries));
      } catch (e) {
        setLastBalanceByFuelId({});
      } finally {
        if (!silent) setLastBalancesLoading(false);
      }
    },
    [selectedCarId, fuelTypes, carsLoading, filters.year, filters.month],
  );

  useEffect(() => {
    loadLastBalances();
  }, [loadLastBalances]);

  // Har bir qator (kun) va har bir yoqilg'i turi uchun, O'SHA QATORDAN
  // OLDIN bo'lgan haqiqiy qoldiqni hisoblaydi. Shu orqali oy ichida,
  // masalan 3-sanaga allaqachon yozuv kiritilgan bo'lsa-yu, 2-sanaga
  // (undan oldingi kunga) keyinroq yozuv qo'shilsa — 2-sana uchun
  // to'g'ri "oldingi" qoldiq ishlatiladi, 3-sananing (kelajakdagi/
  // "hozirgi") qoldig'i emas.
  const balanceBeforeByRow = useMemo(() => {
    const ascending = [...expenses].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return da - db;
    });

    const running = { ...lastBalanceByFuelId };
    const result = {};

    ascending.forEach((row) => {
      const key = row.__placeholder ? `placeholder-${row.date}` : row.id;
      // Bu qatorning o'ziga ta'sir qilishidan OLDINGI holatni saqlaymiz.
      result[key] = { ...running };

      if (!row.__placeholder && row.fuel_id) {
        const computed = extractComputed(row);
        let balanceAfter = computed.balanceAfter;
        if (balanceAfter === null || balanceAfter === undefined) {
          const prev = running[row.fuel_id] ?? 0;
          const received = Number(computed.receivedAmount) || 0;
          const consumed = Number(computed.fuelConsumed) || 0;
          balanceAfter = prev + received - consumed;
        }
        running[row.fuel_id] = Number(balanceAfter);
      }
    });

    return result;
  }, [expenses, lastBalanceByFuelId]);

  const handleAddForDate = async (date, values) => {
    if (!selectedCarId) {
      toastService.error("Avval mashinani tanlang");
      return;
    }

    if (!date || !values.fuel_id || values.odometer_start === "") {
      toastService.error(
        "Barcha maydonlarni to'ldiring: yoqilg'i turi va boshlang'ich spidometr kerak",
      );
      return;
    }

    if (isFutureDate(date)) {
      toastService.error(
        "Ertangi kun uchun ma'lumot qo'shib bo'lmaydi! Faqat bugungi yoki o'tgan kunlar uchun yozuv qo'shishingiz mumkin.",
      );
      return;
    }

    if (
      expenses.some(
        (e) => !e.__placeholder && String(e?.date || "").slice(0, 10) === date,
      )
    ) {
      toastService.error(
        "Bu sanaga allaqachon xarajat kiritilgan. Bir kunga faqat bitta yozuv qo'shish mumkin.",
      );
      return;
    }

    const distanceValue = values.distance === "" ? 0 : Number(values.distance);

    setSavingDate(date);
    const loadingToastId = toastService.loading("Ma'lumot saqlanmoqda...");

    try {
      await apiCost.Create({
        car_id: selectedCarId,
        fuel_id: values.fuel_id,
        date,
        mileage: distanceValue,
        received_amount:
          values.received_amount === "" ? 0 : Number(values.received_amount),
        is_holiday: values.is_holiday,
        note: "",
      });
      toastService.dismiss(loadingToastId);
      toastService.success("Yangi xarajat qo'shildi");
      // silent: true — orqa fonda yangilanadi, sahifa "refresh"
      // bo'lgandek ko'rinmasin uchun skeleton/loading holatlari
      // qayta ishga tushirilmaydi.
      await loadExpenses({ silent: true });
      await loadCars({ silent: true });
      await loadLastBalances({ silent: true });
      await loadInitialBalances({ silent: true });
    } catch (err) {
      toastService.dismiss(loadingToastId);
      toastService.error("Saqlab bo'lmadi: " + err.message);
    } finally {
      setSavingDate(null);
    }
  };

  const startEdit = (row) => {
    if (row.__placeholder) return;
    setEditingId(row.id);
    const { distance, receivedAmount } = extractComputed(row);
    setEditForm({
      date: row.date?.slice(0, 10) || "",
      fuel_id: row.fuel_id,
      odometer_start: row.odometer_start ?? "",
      distance:
        distance !== undefined && distance !== null ? String(distance) : "",
      received_amount:
        receivedAmount !== undefined && receivedAmount !== null
          ? String(receivedAmount)
          : "",
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
      editForm.fuel_id === "" ||
      editForm.odometer_start === "" ||
      editForm.distance === ""
    ) {
      toastService.error("Yoqilg'i turi va yurgan km kerak");
      return;
    }

    if (isFutureDate(editForm.date)) {
      toastService.error("Ertangi kun uchun ma'lumot tahrirlab bo'lmaydi!");
      return;
    }

    setIsSavingEdit(true);
    const loadingToastId = toastService.loading("Yangilanmoqda...");

    try {
      await apiCost.Update(editingId, {
        fuel_id: editForm.fuel_id,
        mileage: Number(editForm.distance),
        received_amount:
          editForm.received_amount === ""
            ? 0
            : Number(editForm.received_amount),
        is_holiday: editForm.is_holiday,
      });

      toastService.dismiss(loadingToastId);
      toastService.success("Yozuv yangilandi");
      cancelEdit();
      await loadExpenses({ silent: true });
      await loadCars({ silent: true });
      await loadLastBalances({ silent: true });
      await loadInitialBalances({ silent: true });
    } catch (err) {
      toastService.dismiss(loadingToastId);
      toastService.error("Saqlab bo'lmadi: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const askDelete = (row) => {
    if (row.__placeholder) return;
    setDeleteTarget(row);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const loadingToastId = toastService.loading("O'chirilmoqda...");
    try {
      await apiCost.Delete(deleteTarget.id);
      toastService.dismiss(loadingToastId);
      toastService.success("Yozuv o'chirildi");
      deleteDialog.onClose();
      await loadExpenses({ silent: true });
      await loadCars({ silent: true });
      await loadLastBalances({ silent: true });
      await loadInitialBalances({ silent: true });
    } catch (err) {
      toastService.dismiss(loadingToastId);
      toastService.error("O'chirib bo'lmadi: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!selectedCarId) {
      toastService.error("Avval mashinani tanlang");
      return;
    }

    const year = filters.year;
    const month = filters.month;

    setIsExporting(true);
    try {
      const response = await apiCost.CarMonthlyReportExcel({
        car_id: selectedCarId,
        fuel_id: filters.fuel_id || undefined,
        year,
        month,
      });

      const car = cars.find((c) => c.id === selectedCarId);
      const safeName = (car?.label || "mashina").replace(/[^\w\- ]+/g, "");
      let fileName = `xarajatlar_${safeName}_${year}-${String(month).padStart(
        2,
        "0",
      )}.xlsx`;

      const disposition = response.headers?.["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastService.success("Excel fayli yuklab olindi");
    } catch (err) {
      toastService.error("Excelga eksport qilib bo'lmadi: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

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
      {/* Sarlavha */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
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
          <IconButton
            aria-label="Mashinalar ko'rinishini almashtirish"
            icon={showCards ? <List size={18} /> : <LayoutGrid size={18} />}
            size="sm"
            variant={showCards ? "solid" : "outline"}
            colorScheme={showCards ? "primary" : "gray"}
            onClick={() => setShowCards((prev) => !prev)}
            borderRadius="md"
            borderColor="border"
          />
        </Flex>
      </Box>

      {/* STICKY FILTER CARD */}
      <Box
        position="sticky"
        top={0}
        zIndex="sticky"
        bg="bg"
        pt={2}
        pb={2}
        mb={6}
        borderBottomWidth="1px"
        borderColor="border"
        boxShadow="sm"
      >
        <CarSelector
          filters={filters}
          onFilterChange={updateFilters}
          fuelTypes={fuelTypes}
          fuelTypesLoading={fuelTypesLoading}
          cars={cars}
          carsLoading={carsLoading}
          selectedCarId={selectedCarId}
          onCarChange={handleCarChange}
          showCards={showCards}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
        />
      </Box>

      {/* Jadval */}
      <Box
        bg="surface"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border"
        boxShadow="md"
        overflow="hidden"
        w="100%"
        mt={6}
      >
        <ExpenseTable
          items={expenses}
          loading={loading}
          fuelTypesById={fuelTypesById}
          noCarSelected={noCarSelected}
          onAddForDate={handleAddForDate}
          savingDate={savingDate}
          fuelTypes={carFuelTypes}
          fuelTypesLoading={
            fuelTypesLoading || normRatesLoading || initialBalancesLoading
          }
          editingId={editingId}
          editForm={editForm}
          onEditFormChange={updateEditForm}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          isSavingEdit={isSavingEdit}
          onDelete={askDelete}
          selectedCarId={selectedCarId}
          normRatesByFuelId={normRatesByFuelId}
          balanceBeforeByRow={balanceBeforeByRow}
          initialBalancesByFuelId={initialBalancesByFuelId}
        />
      </Box>

      {/* Jami statistika */}
      {!loading && !noCarSelected && (
        <Box mt={5}>
          <TotalsSummaryTable totals={totals} />
        </Box>
      )}

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
