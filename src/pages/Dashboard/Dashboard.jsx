import { useEffect, useMemo, useState } from "react";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Center,
  Badge,
  Text,
  Avatar,
  Skeleton,
  Select,
  Divider,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { Fuel, Wallet, Route } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { apiCost } from "../../Services/api/apiCost";

const FUEL_CHART_COLORS = [
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
];

const IGNORED_EXPENSE_KEYS = [
  "id",
  "_id",
  "car_id",
  "fuel_id",
  "createdAt",
  "updatedAt",
  "__v",
];

// Backend'dan kelgan xom maydon nomlarini (fuel_name, mileage,
// is_holiday va h.k.) o'zbekcha sarlavhaga aylantirish uchun lug'at.
// Ro'yxatda yo'q nom kelsa, fallback sifatida labelize() orqali
// chiroyli formatga keltirilib chiqariladi.
const EXPENSE_COLUMN_LABELS = {
  fuel_name: "Yoqilg'i turi",
  fuel_unit: "Birlik",
  mileage: "Bosib o'tilgan (km)",
  distance: "Bosib o'tilgan (km)",
  km: "Bosib o'tilgan (km)",
  received_amount: "Qabul qilingan yoqilg'i",
  received: "Qabul qilingan",
  fuel_expence: "Sarflangan",
  fuel_expense: "Sarflangan",
  expense: "Sarflangan",
  balance_after: "Qoldiq (yoqilg'i)",
  balance: "Qoldiq",
  start_balance: "Boshlang'ich qoldiq",
  end_balance: "Oxirgi qoldiq",
  is_holiday: "Dam olish kuni",
  note: "Izoh",
  comment: "Izoh",
  description: "Izoh",
  price: "Narx",
  driver_name: "Haydovchi",
  odometer: "Odometr",
};

function formatSum(n) {
  return (Number(n) || 0).toLocaleString("ru-RU") + " so'm";
}

function formatNumberSimple(n) {
  return (Number(n) || 0).toLocaleString("uz-UZ");
}

function pick(obj, keys, fallback = 0) {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function labelize(key) {
  if (EXPENSE_COLUMN_LABELS[key]) return EXPENSE_COLUMN_LABELS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// key parametri orqali maxsus maydonlarni (masalan is_holiday)
// alohida o'zbekcha qiymatga o'girish imkonini beradi.
function formatCell(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ha" : "Yo'q";
  if (key === "is_holiday") return value ? "Ha" : "Yo'q";
  if (typeof value === "number") return formatNumberSimple(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeCarStat(entry) {
  const carRaw = pick(entry, ["car"], {});
  const id = pick(carRaw, ["id", "_id", "uuid"], null);
  const name = pick(
    carRaw,
    ["name", "model", "car_name", "title"],
    id ?? "Noma'lum",
  );
  const plate = pick(
    carRaw,
    ["plate_number", "gov_number", "number", "plate"],
    "—",
  );
  const driverName =
    carRaw?.driver?.full_name || pick(carRaw, ["driver_name"], null);

  const fuelsRaw = pick(entry, ["fuels", "fuel_reports"], []);
  const fuelsList = Array.isArray(fuelsRaw) ? fuelsRaw : [];

  const fuelBreakdown = fuelsList.map((fr) => normalizeFuelReport(fr));

  const km = fuelBreakdown.reduce((s, f) => s + f.mileage, 0);
  const summa = fuelBreakdown.reduce((s, f) => s + f.sum, 0);
  const balance = fuelBreakdown.reduce((s, f) => s + f.endBalance, 0);

  return {
    id,
    name: String(name),
    plate: String(plate),
    driver: driverName ? String(driverName) : "—",
    fuelBreakdown,
    km,
    summa,
    balance,
  };
}

/**
 * Bitta "fuel_reports" elementini normallashtirish.
 * Summa hisobi: sarflangan miqdor (litr) × narx (so'm/litr) = jami summa.
 * Bu formula backend'dagi raqamlar bilan tekshirildi va to'g'ri:
 * masalan 3.4 litr × 9300 so'm = 31,620 so'm.
 */
function normalizeFuelReport(fr) {
  const fuelMeta = pick(fr, ["fuel"], {});
  const price = Number(pick(fuelMeta, ["price", "unit_price"], 0));
  const expense = Number(
    pick(fr, ["total_fuel_expence", "total_fuel_expense", "fuel_expence"], 0),
  );

  return {
    fuelId: pick(fr, ["fuel_id"], fuelMeta.id || Math.random()),
    name: pick(fuelMeta, ["name", "label"], "Noma'lum"),
    unit: pick(fuelMeta, ["unit", "measure"], ""),
    price,
    mileage: Number(pick(fr, ["total_mileage", "distance", "km"], 0)),
    received: Number(pick(fr, ["total_received", "received_amount"], 0)),
    expense,
    sum: expense * price,
    startBalance: Number(pick(fr, ["start_balance"], 0)),
    endBalance: Number(pick(fr, ["end_balance", "balance_after"], 0)),
  };
}

// Statistika kartasi — barcha ranglar useColorModeValue orqali,
// shu sabab dark/light rejim o'zgarganda avtomatik moslashadi
function StatCard({ icon: IconCmp, label, value, suffix }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.800", "gray.100");
  const iconBg = useColorModeValue("gray.100", "gray.700");
  const iconColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={cardBorder}
      p={5}
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color={labelColor} fontSize="xs" fontWeight="bold">
            {label.toUpperCase()}
          </StatLabel>
          <StatNumber
            fontSize="2xl"
            color={valueColor}
            fontWeight="bold"
            mt={1}
          >
            {value}
            {suffix && (
              <Text as="span" fontSize="sm" color={labelColor} ml={1}>
                {suffix}
              </Text>
            )}
          </StatNumber>
        </Stat>
        <Center bg={iconBg} borderRadius="lg" boxSize="42px" flexShrink={0}>
          <IconCmp size={20} style={{ color: iconColor }} />
        </Center>
      </Flex>
    </Box>
  );
}

function Dashboard() {
  const toast = useToast();

  // Dark/Light rejimga mos ranglar
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const headingColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const gridStrokeColor = useColorModeValue("#e5e7eb", "#374151");
  const tooltipBg = useColorModeValue("white", "gray.700");
  const tooltipBorder = useColorModeValue("#e5e7eb", "#4b5563");
  const tooltipTextColor = useColorModeValue("#1f2937", "#f3f4f6");
  const axisTickColor = useColorModeValue("#6b7280", "#9ca3af");
  const highlightRowBg = useColorModeValue("blue.50", "blue.900");
  const emptyTextColor = useColorModeValue("gray.500", "gray.400");
  const linkColor = useColorModeValue("blue.600", "blue.300");
  const avatarBg = useColorModeValue("blue.500", "blue.400");
  const badgeBg = useColorModeValue("gray.100", "gray.700");
  const badgeColor = useColorModeValue("gray.700", "gray.200");

  const tooltipContentStyle = {
    borderRadius: "10px",
    border: `1px solid ${tooltipBorder}`,
    background: tooltipBg,
    color: tooltipTextColor,
    fontSize: "13px",
  };

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // --- 1) Barcha mashinalar bo'yicha oylik statistika ---
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadAll = async () => {
      const response = await apiCost.MonthlyStatistics(currentMonth, {
        is_active: true,
      });

      const carsRaw = pick(response, ["cars"], []);
      const carsList = Array.isArray(carsRaw) ? carsRaw : [];
      const normalized = carsList.map(normalizeCarStat);

      if (cancelled) return;
      setVehicles(normalized);
      setLoading(false);

      if (normalized.length > 0) {
        setSelectedCarId((prev) => prev || normalized[0].id);
      }
    };

    loadAll().catch((err) => {
      if (cancelled) return;
      toast({
        title: "Statistikani yuklab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
      setVehicles([]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentMonth, toast]);

  // --- 2) Tanlangan mashina bo'yicha oylik hisobot (fuel_reports) ---
  const [selectedCarId, setSelectedCarId] = useState("");
  const [fuelReports, setFuelReports] = useState([]);
  const [fuelReportsLoading, setFuelReportsLoading] = useState(false);
  const [selectedFuelId, setSelectedFuelId] = useState("");

  useEffect(() => {
    if (!selectedCarId) {
      setFuelReports([]);
      return;
    }
    let cancelled = false;
    setFuelReportsLoading(true);

    apiCost
      .MonthlyReport(selectedCarId, currentMonth)
      .then((response) => {
        if (cancelled) return;
        const reportsRaw = pick(response, ["fuel_reports"], []);
        const reportsList = Array.isArray(reportsRaw) ? reportsRaw : [];
        const normalized = reportsList.map(normalizeFuelReport);
        setFuelReports(normalized);
        setSelectedFuelId(normalized.length > 0 ? normalized[0].fuelId : "");
      })
      .catch((err) => {
        if (cancelled) return;
        // 404 — bu mashina uchun shu oyda hisobot yozuvi yo'q, xato emas
        if (err?.response?.status === 404) {
          setFuelReports([]);
          setSelectedFuelId("");
          return;
        }
        toast({
          title: "Mashina hisobotini yuklab bo'lmadi",
          description: err.message,
          status: "error",
          duration: 4000,
        });
        setFuelReports([]);
        setSelectedFuelId("");
      })
      .finally(() => {
        if (!cancelled) setFuelReportsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCarId, currentMonth, toast]);

  // --- 3) Tanlangan mashina + yoqilg'i bo'yicha kunlik yozuvlar ---
  const [dailyDays, setDailyDays] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (!selectedCarId || !selectedFuelId) {
      setDailyDays([]);
      return;
    }
    let cancelled = false;
    setDailyLoading(true);

    apiCost
      .CarMonthlyReport(selectedCarId, currentMonth, selectedFuelId)
      .then((response) => {
        if (cancelled) return;
        const daysRaw = pick(response, ["days"], []);
        setDailyDays(Array.isArray(daysRaw) ? daysRaw : []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setDailyDays([]);
          return;
        }
        toast({
          title: "Kunlik hisobotni yuklab bo'lmadi",
          description: err.message,
          status: "error",
          duration: 4000,
        });
        setDailyDays([]);
      })
      .finally(() => {
        if (!cancelled) setDailyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCarId, selectedFuelId, currentMonth, toast]);

  const totalKm = vehicles.reduce((s, v) => s + v.km, 0);
  const totalSumAll = vehicles.reduce((s, v) => s + v.summa, 0);
  const totalBalance = vehicles.reduce((s, v) => s + v.balance, 0);

  const fuelBreakdownList = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      v.fuelBreakdown.forEach((f) => {
        if (!map[f.fuelId]) {
          map[f.fuelId] = {
            fuelId: f.fuelId,
            name: f.name,
            unit: f.unit,
            expense: 0,
            sum: 0,
          };
        }
        map[f.fuelId].expense += f.expense;
        map[f.fuelId].sum += f.sum;
      });
    });
    return Object.values(map);
  }, [vehicles]);

  function fuelSummaryText(vehicle) {
    if (!vehicle.fuelBreakdown.length) return "—";
    return vehicle.fuelBreakdown
      .map((f) => `${formatNumberSimple(f.expense)} ${f.unit}`)
      .join(", ");
  }

  const selectedCar = vehicles.find((v) => v.id === selectedCarId) || null;

  const daysWithExpenses = useMemo(
    () =>
      dailyDays.filter(
        (d) => Array.isArray(d.expenses) && d.expenses.length > 0,
      ),
    [dailyDays],
  );

  const expenseColumns = useMemo(() => {
    const keys = new Set();
    daysWithExpenses.forEach((d) => {
      d.expenses.forEach((exp) => {
        Object.keys(exp || {}).forEach((k) => {
          if (!IGNORED_EXPENSE_KEYS.includes(k)) keys.add(k);
        });
      });
    });
    return Array.from(keys);
  }, [daysWithExpenses]);

  return (
    <Box p={{ base: 4, md: 6 }} bg={pageBg} minH="100vh">
      {/* PAGE HEADER */}
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        mb={6}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Box>
          <Heading size="lg" color={headingColor}>
            Dashboard
          </Heading>
          <Text color={subTextColor} fontSize="sm" mt={1}>
            Avtomobil yoqilg'i hisoboti — {currentMonth}
          </Text>
        </Box>
        <Badge
          fontSize="sm"
          bg={badgeBg}
          color={badgeColor}
          px={2}
          py={1}
          borderRadius="md"
        >
          {new Date().toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Badge>
      </Flex>

      {/* UMUMIY STATISTIKA */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={5} mb={5}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Qoldiq balans"
              value={formatNumberSimple(totalBalance)}
            />
            <StatCard
              icon={Fuel}
              label="Jami xarajat (oy)"
              value={formatNumberSimple(totalSumAll)}
              suffix="so'm"
            />
            <StatCard
              icon={Route}
              label="Jami kilometraj"
              value={formatNumberSimple(totalKm)}
              suffix="km"
            />
          </>
        )}
      </SimpleGrid>

      {/* YOQILG'I TURLARI BO'YICHA KARTALAR */}
      {!loading && fuelBreakdownList.length > 0 && (
        <SimpleGrid
          columns={{
            base: 1,
            sm: 2,
            xl: Math.min(fuelBreakdownList.length, 4),
          }}
          spacing={5}
          mb={6}
        >
          {fuelBreakdownList.map((f) => (
            <StatCard
              key={f.fuelId}
              icon={Fuel}
              label={`${f.name} sarfi (oy)`}
              value={formatNumberSimple(f.expense)}
              suffix={f.unit}
            />
          ))}
        </SimpleGrid>
      )}

      {/* GRAFIKLAR */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={8}>
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder}>
          <CardHeader>
            <Heading size="sm" color={headingColor}>
              Avtomobillar bo'yicha xarajat
            </Heading>
          </CardHeader>
          <CardBody pt={0}>
            {loading ? (
              <Skeleton height="290px" borderRadius="lg" />
            ) : vehicles.length === 0 ? (
              <Center h="290px">
                <Text color={emptyTextColor} fontSize="sm">
                  Bu oy uchun ma'lumot yo'q
                </Text>
              </Center>
            ) : (
              <Box h="290px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicles} barSize={38}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridStrokeColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor }}
                    />
                    <YAxis
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor }}
                    />
                    <Tooltip
                      formatter={(v) => formatSum(v)}
                      contentStyle={tooltipContentStyle}
                    />
                    <Bar dataKey="summa" radius={[8, 8, 0, 0]} fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} border="1px solid" borderColor={cardBorder}>
          <CardHeader>
            <Heading size="sm" color={headingColor}>
              Yoqilg'i turi bo'yicha taqsimot
            </Heading>
          </CardHeader>
          <CardBody pt={0}>
            {loading ? (
              <Skeleton height="290px" borderRadius="lg" />
            ) : fuelBreakdownList.length === 0 ? (
              <Center h="290px">
                <Text color={emptyTextColor} fontSize="sm">
                  Bu oy uchun ma'lumot yo'q
                </Text>
              </Center>
            ) : (
              <Box h="290px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelBreakdownList}
                      dataKey="sum"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={4}
                    >
                      {fuelBreakdownList.map((f, i) => (
                        <Cell
                          key={f.fuelId}
                          fill={FUEL_CHART_COLORS[i % FUEL_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatSum(v)}
                      contentStyle={tooltipContentStyle}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", color: axisTickColor }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* MASHINALAR RO'YXATI (monthly-statistics) */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} mb={8}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="sm" color={headingColor}>
              Avtomobillar ro'yxati
            </Heading>
            <Badge
              fontSize="xs"
              bg={badgeBg}
              color={badgeColor}
              px={2}
              py={1}
              borderRadius="md"
            >
              {vehicles.length} TA
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody pt={0} overflowX="auto">
          {loading ? (
            <Box py={4}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} height="42px" my={2} borderRadius="md" />
              ))}
            </Box>
          ) : vehicles.length === 0 ? (
            <Center py={10}>
              <Text color={emptyTextColor} fontSize="sm">
                Mashinalar topilmadi
              </Text>
            </Center>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Avtomobil</Th>
                  <Th>Davlat raqami</Th>
                  <Th>Haydovchi</Th>
                  <Th isNumeric>Sarflangan</Th>
                  <Th isNumeric>Summa</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {vehicles.map((v) => (
                  <Tr
                    key={v.id}
                    bg={v.id === selectedCarId ? highlightRowBg : undefined}
                  >
                    <Td>
                      <Flex align="center" gap={3}>
                        <Avatar
                          size="sm"
                          name={v.name}
                          bg={avatarBg}
                          color="white"
                        />
                        <Text fontWeight="600" color={headingColor}>
                          {v.name}
                        </Text>
                      </Flex>
                    </Td>
                    <Td color={subTextColor}>{v.plate}</Td>
                    <Td color={subTextColor}>{v.driver}</Td>
                    <Td isNumeric color={subTextColor}>
                      {fuelSummaryText(v)}
                    </Td>
                    <Td isNumeric fontWeight="600" color={headingColor}>
                      {formatSum(v.summa)}
                    </Td>
                    <Td>
                      <Text
                        as="button"
                        fontSize="sm"
                        color={linkColor}
                        fontWeight="600"
                        onClick={() => setSelectedCarId(v.id)}
                      >
                        Batafsil
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* BATAFSIL HISOBOT — tanlangan mashina */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} mb={8}>
        <CardHeader>
          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
          >
            <Heading size="sm" color={headingColor}>
              Batafsil hisobot
            </Heading>
            <Flex gap={3} wrap="wrap">
              <Select
                size="sm"
                width="220px"
                placeholder="Avtomobilni tanlang"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate})
                  </option>
                ))}
              </Select>
              <Select
                size="sm"
                width="180px"
                placeholder="Yoqilg'i turi"
                value={selectedFuelId}
                onChange={(e) => setSelectedFuelId(e.target.value)}
                isDisabled={fuelReports.length === 0}
              >
                {fuelReports.map((f) => (
                  <option key={f.fuelId} value={f.fuelId}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Flex>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          {!selectedCarId ? (
            <Center py={10}>
              <Text color={emptyTextColor} fontSize="sm">
                Batafsil ma'lumot ko'rish uchun avtomobilni tanlang
              </Text>
            </Center>
          ) : (
            <>
              {/* Oylik hisobot: fuel_reports jadvali */}
              <Text fontWeight="600" mb={2} color={headingColor}>
                {selectedCar?.name} — oylik yoqilg'i hisoboti
              </Text>
              {fuelReportsLoading ? (
                <Skeleton height="120px" borderRadius="md" mb={6} />
              ) : fuelReports.length === 0 ? (
                <Center py={6} mb={6}>
                  <Text color={emptyTextColor} fontSize="sm">
                    Bu oy uchun yozuv yo'q
                  </Text>
                </Center>
              ) : (
                <Box overflowX="auto" mb={6}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Yoqilg'i turi</Th>
                        <Th>Birlik</Th>
                        <Th isNumeric>Bosib o'tilgan (km)</Th>
                        <Th isNumeric>Qabul qilingan yoqilg'i</Th>
                        <Th isNumeric>Sarflangan yoqilg'i</Th>
                        <Th isNumeric>Summa</Th>
                        <Th isNumeric>Boshlang'ich qoldiq</Th>
                        <Th isNumeric>Oxirgi qoldiq</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {fuelReports.map((f) => (
                        <Tr
                          key={f.fuelId}
                          bg={
                            f.fuelId === selectedFuelId
                              ? highlightRowBg
                              : undefined
                          }
                        >
                          <Td fontWeight="600" color={headingColor}>
                            {f.name}
                          </Td>
                          <Td color={subTextColor}>{f.unit}</Td>
                          <Td isNumeric color={subTextColor}>
                            {formatNumberSimple(f.mileage)}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            {formatNumberSimple(f.received)}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            {formatNumberSimple(f.expense)}
                          </Td>
                          <Td isNumeric color={headingColor} fontWeight="600">
                            {formatSum(f.sum)}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            {formatNumberSimple(f.startBalance)}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            {formatNumberSimple(f.endBalance)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}

              <Divider mb={6} borderColor={cardBorder} />

              {/* Kunlik yozuvlar: car-monthly-report */}
              <Text fontWeight="600" mb={2} color={headingColor}>
                Kunlik yozuvlar
              </Text>
              {dailyLoading ? (
                <Skeleton height="160px" borderRadius="md" />
              ) : !selectedFuelId ? (
                <Center py={6}>
                  <Text color={emptyTextColor} fontSize="sm">
                    Yoqilg'i turini tanlang
                  </Text>
                </Center>
              ) : daysWithExpenses.length === 0 ? (
                <Center py={6}>
                  <Text color={emptyTextColor} fontSize="sm">
                    Bu oy uchun kunlik yozuvlar yo'q
                  </Text>
                </Center>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Sana</Th>
                        {expenseColumns.map((col) => (
                          <Th key={col}>{labelize(col)}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {daysWithExpenses.map((day) =>
                        day.expenses.map((exp, idx) => (
                          <Tr key={`${day.date}-${idx}`}>
                            <Td color={subTextColor}>{day.date}</Td>
                            {expenseColumns.map((col) => (
                              <Td key={col} color={subTextColor}>
                                {formatCell(exp?.[col], col)}
                              </Td>
                            ))}
                          </Tr>
                        )),
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}

export default Dashboard;
