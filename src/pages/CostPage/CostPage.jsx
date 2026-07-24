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
  Tooltip,
} from "@chakra-ui/react";
import {
  Plus,
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
} from "lucide-react";
import { apiCost } from "../../Services/api/apiCost";
import { apiFuel } from "../../Services/api/Fuels";
import { apiCars } from "../../Services/api/Cars";
import { toastService } from "../../utils/toast";

// ---------- constants & helpers ----------
const FETCH_LIMIT = 100;

const formatAsInputDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => formatAsInputDate(new Date());
const getMonthStartDate = () => {
  const d = new Date();
  d.setDate(1);
  return formatAsInputDate(d);
};

const isFutureDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
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

// ---------- shared input styles ----------
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

// ---------- sub-components (o'zgarmagan) ----------
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

// ---------- FILTER BAR ----------
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
      {trailing}
    </Flex>
  );
}

// ---------- CarPickerSelect ----------
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

// ---------- PlateNumber ----------
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

// ---------- CarCard & CarCardsGrid ----------
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

// ---------- CarSelector ----------
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
    <Box mb={6} w="100%">
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

// ---------- custom hooks ----------
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

// ---------- inline row components ----------
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
        <EstimatedCell value={estimatedSum} unit="so'm" />
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
        <Input
          type="date"
          size="sm"
          value={editForm.date}
          onChange={(e) => onChange({ date: e.target.value })}
          {...inputStyles}
        />
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
        <EstimatedCell value={computedBalanceAfter} unit={selectedUnit} />
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
  isLastRow,
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
  const showActions = isLastRow && editingId === null;

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
            ? `${formatNumber(Number(row.odometer_end) - Number(row.odometer_start))} km`
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

// ---------- Jami statistika (JADVAL ko'rinishida) ----------
function TotalsSummaryTable({ totals }) {
  if (!totals || totals.length === 0) return null;

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
      <TableContainer w="100%">
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

// ---------- main table ----------
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
          Sarflangan
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          Spidometr (boshi)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          Spidometr (oxiri)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="100px">
          Yurgan (km)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="120px">
          Summa (so'm)
        </Th>
        <Th color="textSecondary" borderColor="border" isNumeric minW="110px">
          Qoldiq
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
    const isLast = idx === items.length - 1;
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
        isLastRow={isLast}
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

// ---------- delete dialog ----------
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

// ---------- defaults ----------
const DEFAULT_FILTERS = {
  fuel_id: "",
  date_from: getMonthStartDate(),
  date_to: getTodayDate(),
  sortBy: "date",
  sortOrder: "ASC",
};

// ============================================================
// ASOSIY KOMPONENT – CostPage (toastService bilan)
// ============================================================
function CostPage() {
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [showCards, setShowCards] = useState(false);

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
      toastService.error(
        "Mashinalar ro'yxatini yuklab bo'lmadi: " + err.message,
      );
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState([]);
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
      toastService.error("Yoqilg'i turlarini yuklab bo'lmadi: " + err.message);
      setFuelTypes([]);
    } finally {
      setFuelTypesLoading(false);
    }
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
  }, [fuelTypes, newRow.fuel_id]);

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
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleCarChange = (id) => {
    setSelectedCarId(id);
    setExpenses([]);
    setTotals([]);
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
      return;
    }
    setLoading(true);
    try {
      const data = await apiCost.All(1, FETCH_LIMIT, {
        car_id: selectedCarId,
        fuel_id: filters.fuel_id,
        date_from: filters.date_from,
        date_to: filters.date_to,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setExpenses(extractList(data));
      setTotals(extractTotals(data).map(normalizeTotal));
    } catch (err) {
      toastService.error("Ro'yxatni yuklab bo'lmadi: " + err.message);
      setTotals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCarId, filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // auto-fill odometer start
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
  }, [selectedCarId, expenses, loading, cars, newRow.odometer_start]);

  const handleAddRow = async () => {
    if (!selectedCarId) {
      toastService.error("Avval mashinani tanlang");
      return;
    }

    if (
      !newRow.date ||
      !newRow.fuel_id ||
      newRow.odometer_start === "" ||
      newRow.distance === "" ||
      newRow.received_amount === ""
    ) {
      toastService.error(
        "Barcha maydonlarni to'ldiring: Sana, yoqilg'i turi, necha km yurgan va olingan miqdor kerak",
      );
      return;
    }

    if (isFutureDate(newRow.date)) {
      toastService.error(
        "Ertangi kun uchun ma'lumot qo'shib bo'lmaydi! Faqat bugungi yoki o'tgan kunlar uchun yozuv qo'shishingiz mumkin.",
      );
      return;
    }

    if (Number(newRow.distance) <= 0) {
      toastService.error("Yurgan km 0 dan katta bo'lishi kerak");
      return;
    }

    const odometerStart = Number(newRow.odometer_start);
    const odometerEnd = odometerStart + Number(newRow.distance);

    setIsSavingRow(true);
    const loadingToastId = toastService.loading("Ma'lumot saqlanmoqda...");

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
      }

      toastService.dismiss(loadingToastId);
      toastService.success("Yangi xarajat qo'shildi");

      setNewRow({
        ...EMPTY_NEW_ROW,
        date: getTodayDate(),
        fuel_id: newRow.fuel_id,
        odometer_start: String(odometerEnd),
      });

      loadExpenses();
    } catch (err) {
      toastService.dismiss(loadingToastId);
      toastService.error("Saqlab bo'lmadi: " + err.message);
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
      toastService.error("Yurgan km va olingan miqdor kerak");
      return;
    }

    if (isFutureDate(editForm.date)) {
      toastService.error("Ertangi kun uchun ma'lumot tahrirlab bo'lmaydi!");
      return;
    }

    if (Number(editForm.distance) <= 0) {
      toastService.error("Yurgan km 0 dan katta bo'lishi kerak");
      return;
    }

    const odometerStart = Number(editForm.odometer_start);
    const odometerEnd = odometerStart + Number(editForm.distance);

    setIsSavingEdit(true);
    const loadingToastId = toastService.loading("Yangilanmoqda...");

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

      toastService.dismiss(loadingToastId);
      toastService.success("Yozuv yangilandi");
      cancelEdit();
      loadExpenses();
    } catch (err) {
      toastService.dismiss(loadingToastId);
      toastService.error("Saqlab bo'lmadi: " + err.message);
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
    const loadingToastId = toastService.loading("O'chirilmoqda...");
    try {
      await apiCost.Delete(deleteTarget.id);
      toastService.dismiss(loadingToastId);
      toastService.success("Yozuv o'chirildi");
      deleteDialog.onClose();
      loadExpenses();
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

    // filters.date_from dan yil va oyni olamiz (backend "year" va "month" so'raydi)
    const refDate = new Date(filters.date_from || getTodayDate());
    const year = refDate.getFullYear();
    const month = refDate.getMonth() + 1;

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
          <Tooltip
            label={showCards ? "Ro'yxat ko'rinishi" : "Kartochka ko'rinishi"}
            hasArrow
            placement="left"
          >
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
          </Tooltip>
        </Flex>
      </Box>

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
      </Box>

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
