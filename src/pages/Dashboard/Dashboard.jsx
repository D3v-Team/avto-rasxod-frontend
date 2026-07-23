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
  Flex,
  HStack,
  Center,
  Badge,
  Text,
  Select,
  Skeleton,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { Users, Car as CarIcon, UserCog, Fuel } from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { apiStatistika } from "../../Services/api/apiStatistika";
import { apiCars } from "../../Services/api/Cars";

const MONTH_LABELS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyun",
  "Iyul",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

// Xodim rollarini o'zbekcha ko'rsatish uchun lug'at
const ROLE_LABELS = {
  driver: "Haydovchilar",
  responsible: "Mas'ullar",
  admin: "Adminlar",
  manager: "Menejerlar",
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

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  const nested = pick(payload, ["items", "data", "results"], null);
  if (Array.isArray(nested)) return nested;
  return [];
}

function labelize(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function roleLabel(role) {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return labelize(String(role || ""));
}

function normalizeCarOption(raw) {
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

// Statistika kartasi — barcha ranglar useColorModeValue orqali,
// shu sabab dark/light rejim o'zgarganda avtomatik moslashadi
function StatCard({ icon: IconCmp, label, value, suffix, accent = "gray" }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.800", "gray.100");
  const iconBg = useColorModeValue(`${accent}.50`, `${accent}.900`);
  const iconColor = useColorModeValue(`${accent}.600`, `${accent}.300`);

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={cardBorder}
      p={5}
      transition="all 0.15s ease"
      _hover={{ shadow: "md", transform: "translateY(-2px)" }}
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel
            color={labelColor}
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.03em"
          >
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
        <Center bg={iconBg} borderRadius="xl" boxSize="46px" flexShrink={0}>
          <IconCmp size={22} style={{ color: iconColor }} />
        </Center>
      </Flex>
    </Box>
  );
}

// Yillik jami ko'rsatkichlar — tanlangan mashina + yoqilg'i turi bo'yicha
function MiniStat({ label, value, labelColor, valueColor }) {
  return (
    <Box>
      <Text
        fontSize="10px"
        fontWeight="bold"
        color={labelColor}
        letterSpacing="0.03em"
      >
        {label.toUpperCase()}
      </Text>
      <Text fontSize="md" fontWeight="bold" color={valueColor} mt={0.5}>
        {value}
      </Text>
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
  const emptyTextColor = useColorModeValue("gray.500", "gray.400");
  const badgeBg = useColorModeValue("gray.100", "gray.700");
  const badgeColor = useColorModeValue("gray.700", "gray.200");
  const selectBg = useColorModeValue("white", "gray.800");
  const selectBorder = useColorModeValue("gray.200", "gray.700");
  const iconPillBg = useColorModeValue("purple.50", "purple.900");
  const iconPillColor = useColorModeValue("purple.600", "purple.300");
  const fuelPillBg = useColorModeValue("teal.50", "teal.900");
  const fuelPillColor = useColorModeValue("teal.600", "teal.300");
  const statBoxBg = useColorModeValue("gray.50", "gray.900");

  const tooltipContentStyle = {
    borderRadius: "10px",
    border: `1px solid ${tooltipBorder}`,
    background: tooltipBg,
    color: tooltipTextColor,
    fontSize: "13px",
  };

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // --- 0) Umumiy xodimlar va mashinalar soni ---
  const [counts, setCounts] = useState({ roles: [], totalCars: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCountsLoading(true);

    apiStatistika
      .AllEmployeesAndCarsCounts()
      .then((response) => {
        if (cancelled) return;
        setCounts({
          roles: pick(response, ["totalEmployees"], []),
          totalCars: pick(response, ["totalCars"], 0),
        });
      })
      .catch((err) => {
        if (cancelled) return;
        toast({
          title: "Xodimlar sonini yuklab bo'lmadi",
          description: err.message,
          status: "error",
          duration: 4000,
        });
      })
      .finally(() => {
        if (!cancelled) setCountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // --- 1) Mashinalar ro'yxati (select uchun) ---
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCarsLoading(true);

    apiCars
      .All(1, 100, "", true, "", "", "name", "ASC")
      .then((response) => {
        if (cancelled) return;
        const raw = extractList(response?.data);
        const normalized = raw.map(normalizeCarOption);
        setCars(normalized);
        if (normalized.length === 1) {
          setSelectedCarId(normalized[0].id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast({
          title: "Mashinalar ro'yxatini yuklab bo'lmadi",
          description: err.message,
          status: "error",
          duration: 4000,
        });
        setCars([]);
      })
      .finally(() => {
        if (!cancelled) setCarsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // --- 2) Tanlangan mashina uchun yillik statistika ---
  const [yearlyCar, setYearlyCar] = useState(null); // { car, fuels: [...] }
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [selectedFuelId, setSelectedFuelId] = useState("");

  useEffect(() => {
    if (!selectedCarId) {
      setYearlyCar(null);
      setSelectedFuelId("");
      return;
    }

    let cancelled = false;
    setYearlyLoading(true);

    apiStatistika
      .YearlyStatistics(currentYear, { car_id: selectedCarId })
      .then((response) => {
        if (cancelled) return;
        const carsArr = pick(response, ["cars"], []);
        const carEntry = Array.isArray(carsArr) ? carsArr[0] : null;
        setYearlyCar(carEntry || null);

        const fuels = pick(carEntry, ["fuels"], []);
        setSelectedFuelId((prev) => {
          if (prev && fuels.some((f) => f.fuel_id === prev)) return prev;
          return fuels.length > 0 ? fuels[0].fuel_id : "";
        });
      })
      .catch((err) => {
        if (cancelled) return;
        toast({
          title: "Yillik statistikani yuklab bo'lmadi",
          description: err.message,
          status: "error",
          duration: 4000,
        });
        setYearlyCar(null);
      })
      .finally(() => {
        if (!cancelled) setYearlyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCarId, currentYear, toast]);

  const fuels = yearlyCar?.fuels || [];
  const selectedFuel =
    fuels.find((f) => f.fuel_id === selectedFuelId) || fuels[0] || null;

  const chartData = useMemo(() => {
    if (!selectedFuel) return [];
    const byMonth = {};
    (selectedFuel.monthly_breakdown || []).forEach((m) => {
      byMonth[m.month] = m;
    });
    return MONTH_LABELS.map((label, idx) => {
      const m = byMonth[idx + 1] || {};
      return {
        month: label,
        summa: Number(m.total_reaceved_price) || 0,
        expense: Number(m.total_fuel_expence) || 0,
      };
    });
  }, [selectedFuel]);

  const yearlyTotal = selectedFuel?.yearly_total || null;
  const fuelUnit = selectedFuel?.fuel_unit || "";

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
            Bosh sahifa
          </Heading>
          <Text color={subTextColor} fontSize="sm" mt={1}>
            Avtomobil yoqilg'i hisoboti — {currentMonth}
          </Text>
        </Box>
        <Badge
          fontSize="sm"
          bg={badgeBg}
          color={badgeColor}
          px={3}
          py={1.5}
          borderRadius="full"
        >
          {new Date().toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Badge>
      </Flex>

      {/* XODIMLAR VA MASHINALAR SONI */}
      <SimpleGrid
        columns={{
          base: 1,
          sm: 2,
          xl: Math.min((counts.roles?.length || 0) + 1, 4) || 2,
        }}
        spacing={5}
        mb={5}
      >
        {countsLoading ? (
          [...Array(2)].map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={CarIcon}
              label="Jami mashinalar"
              value={formatNumberSimple(counts.totalCars)}
              accent="purple"
            />
            {counts.roles.map((r) => (
              <StatCard
                key={r.role}
                icon={r.role === "driver" ? UserCog : Users}
                label={roleLabel(r.role)}
                value={formatNumberSimple(r.count)}
                accent="teal"
              />
            ))}
          </>
        )}
      </SimpleGrid>

      {/* YILLIK XARAJAT VA YOQILG'I SARFI DINAMIKASI — mashina + yoqilg'i turi bo'yicha real ma'lumot */}
      <Card
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        overflow="hidden"
        mt={5}
      >
        <CardHeader pb={0}>
          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
          >
            <Box>
              <Heading size="sm" color={headingColor}>
                Yillik xarajat va yoqilg'i sarfi dinamikasi
              </Heading>
              <Text color={subTextColor} fontSize="xs" mt={1}>
                {currentYear}-yil, oylar kesimida
              </Text>
            </Box>

            <HStack spacing={2.5} wrap="wrap">
              {/* Mashina select */}
              {carsLoading ? (
                <Skeleton h="38px" w="220px" borderRadius="lg" />
              ) : (
                <HStack
                  spacing={0}
                  borderWidth="1px"
                  borderColor={selectedCarId ? "purple.400" : selectBorder}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={selectBg}
                  transition="all 0.2s ease"
                >
                  <Center
                    boxSize="38px"
                    bg={iconPillBg}
                    color={iconPillColor}
                    flexShrink={0}
                  >
                    <CarIcon size={17} />
                  </Center>
                  <Select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    size="sm"
                    h="38px"
                    minW="190px"
                    border="none"
                    borderRadius="0"
                    placeholder="Mashinani tanlang"
                    bg="transparent"
                    color={headingColor}
                    fontWeight="600"
                    _focus={{ boxShadow: "none" }}
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}

              {/* Yoqilg'i turi select — faqat 2+ tur bo'lsa ko'rsatiladi */}
              {!yearlyLoading && fuels.length > 1 && (
                <HStack
                  spacing={0}
                  borderWidth="1px"
                  borderColor={selectBorder}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={selectBg}
                >
                  <Center
                    boxSize="38px"
                    bg={fuelPillBg}
                    color={fuelPillColor}
                    flexShrink={0}
                  >
                    <Fuel size={16} />
                  </Center>
                  <Select
                    value={selectedFuelId}
                    onChange={(e) => setSelectedFuelId(e.target.value)}
                    size="sm"
                    h="38px"
                    minW="140px"
                    border="none"
                    borderRadius="0"
                    bg="transparent"
                    color={headingColor}
                    fontWeight="600"
                    _focus={{ boxShadow: "none" }}
                  >
                    {fuels.map((f) => (
                      <option key={f.fuel_id} value={f.fuel_id}>
                        {f.fuel_name}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody pt={4}>
          {!selectedCarId ? (
            <Center py={16} flexDirection="column" gap={3}>
              <Center
                bgGradient="linear(to-br, purple.500, teal.400)"
                borderRadius="full"
                boxSize="60px"
                boxShadow="lg"
                opacity={0.9}
              >
                <CarIcon size={24} color="white" />
              </Center>
              <Text color={headingColor} fontWeight="bold" fontSize="md" mt={1}>
                Avval mashinani tanlang
              </Text>
              <Text
                color={emptyTextColor}
                fontSize="sm"
                maxW="360px"
                textAlign="center"
              >
                Yillik xarajat va yoqilg'i sarfi grafigini ko'rish uchun
                yuqoridan mashinani tanlang
              </Text>
            </Center>
          ) : yearlyLoading ? (
            <Skeleton h="320px" borderRadius="lg" />
          ) : !selectedFuel ? (
            <Center py={16} flexDirection="column" gap={2}>
              <Text color={headingColor} fontWeight="bold" fontSize="md">
                Ma'lumot topilmadi
              </Text>
              <Text color={emptyTextColor} fontSize="sm">
                Tanlangan mashina uchun {currentYear}-yilda yoqilg'i yozuvlari
                yo'q
              </Text>
            </Center>
          ) : (
            <>
              {/* Yillik jami ko'rsatkichlar */}
              {yearlyTotal && (
                <SimpleGrid
                  columns={{ base: 2, sm: 4 }}
                  spacing={4}
                  bg={statBoxBg}
                  borderRadius="xl"
                  p={4}
                  mb={5}
                >
                  <MiniStat
                    label="Yurgan masofa"
                    value={`${formatNumberSimple(yearlyTotal.total_mileage)} km`}
                    labelColor={subTextColor}
                    valueColor={headingColor}
                  />
                  <MiniStat
                    label="Olingan yoqilg'i"
                    value={`${formatNumberSimple(yearlyTotal.total_received_amount)} ${fuelUnit}`}
                    labelColor={subTextColor}
                    valueColor={headingColor}
                  />
                  <MiniStat
                    label="Sarflangan yoqilg'i"
                    value={`${formatNumberSimple(yearlyTotal.total_fuel_expence)} ${fuelUnit}`}
                    labelColor={subTextColor}
                    valueColor={headingColor}
                  />
                  <MiniStat
                    label="Jami xarajat"
                    value={formatSum(yearlyTotal.total_reaceved_price)}
                    labelColor={subTextColor}
                    valueColor={headingColor}
                  />
                </SimpleGrid>
              )}

              <Box h="320px">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridStrokeColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor }}
                    />
                    <YAxis
                      yAxisId="left"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor }}
                      tickFormatter={(v) => formatNumberSimple(v)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: axisTickColor }}
                    />
                    <Tooltip
                      formatter={(v, name) =>
                        name === "Xarajat"
                          ? [formatSum(v), name]
                          : [`${formatNumberSimple(v)} ${fuelUnit}`, name]
                      }
                      contentStyle={tooltipContentStyle}
                      cursor={{ fill: gridStrokeColor, opacity: 0.3 }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", color: axisTickColor }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="expense"
                      name={`Sarflangan yoqilg'i (${fuelUnit})`}
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                      barSize={22}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="summa"
                      name="Xarajat"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#3B82F6" }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}

export default Dashboard;
