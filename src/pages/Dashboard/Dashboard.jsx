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
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  IconButton,
  Spacer,
} from "@chakra-ui/react";
import {
  Users,
  Car as CarIcon,
  UserCog,
  Fuel,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { toastService } from "../../utils/toast";

// ------------------- KONSTANTALAR -------------------
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

const ROLE_LABELS = {
  driver: "Haydovchilar",
  responsible: "Mas'ullar",
  admin: "Adminlar",
  manager: "Menejerlar",
};

// ------------------- YORDAMCHI FUNKSIYALAR -------------------
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

// Backend javobi "groups[].cars[]" ko'rinishida guruhlangan holda keladi
// (har bir guruh — mas'ul shaxs bo'yicha). Jadval uchun barcha guruhlardagi
// mashinalarni bitta tekis ro'yxatga yig'amiz. Boshqa mumkin bo'lgan
// (flat) shakllar uchun fallback ham qoldirilgan.
function extractReportList(response) {
  if (Array.isArray(response?.groups)) {
    return response.groups.flatMap((g) =>
      Array.isArray(g?.cars) ? g.cars : [],
    );
  }
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.rows)) return response.rows;
  return [];
}

function extractReportTotal(response) {
  const candidates = [
    response?.total,
    response?.data?.total,
    response?.meta?.total,
    response?.count,
    response?.data?.count,
  ];
  const found = candidates.find((v) => v !== undefined && v !== null);
  return found !== undefined ? found : 0;
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

// ------------------- STAT CARD KOMPONENTI -------------------
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
  // Chakra UI ranglari
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
  const tableBg = useColorModeValue("white", "gray.800");
  const tableHoverBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const fuelHeaderBg = useColorModeValue("gray.50", "gray.900");
  // guruhlar orasidagi ajratuvchi (qalinroq) chiziq rangi
  const groupDividerColor = useColorModeValue("gray.400", "gray.500");
  const groupDividerWidth = "2px";

  const tooltipContentStyle = {
    borderRadius: "10px",
    border: `1px solid ${tooltipBorder}`,
    background: tooltipBg,
    color: tooltipTextColor,
    fontSize: "13px",
  };

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonthNumber = useMemo(() => new Date().getMonth() + 1, []);

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
        toastService.error(`Xodimlar sonini yuklab bo'lmadi: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setCountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 1) Mashinalar ro'yxati (select uchun) ---
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCarsLoading(true);
    apiCars
      // ✅ TUZATILDI: is_deleted uchun `false` qo'shildi (5-argument).
      // Avval bu joy bo'sh qoldirilgani sababli keyingi qiymatlar
      // ("name", "ASC") mos kelmay, driver_id / sortBy ga tushib,
      // backenddan 400 xatolik qaytarilayotgan edi.
      .All(1, 100, "", true, false, "", "", "name", "ASC")
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
        toastService.error(
          `Mashinalar ro'yxatini yuklab bo'lmadi: ${err.message}`,
        );
        setCars([]);
      })
      .finally(() => {
        if (!cancelled) setCarsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 2) Tanlangan mashina uchun yillik statistika ---
  const [yearlyCar, setYearlyCar] = useState(null);
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
        toastService.error(
          `Yillik statistikani yuklab bo'lmadi: ${err.message}`,
        );
        setYearlyCar(null);
      })
      .finally(() => {
        if (!cancelled) setYearlyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCarId, currentYear]);

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

  // --- 3) Tashkilot bo'yicha oylik hisobot ---
  const [orgReportData, setOrgReportData] = useState([]);
  const [orgReportLoading, setOrgReportLoading] = useState(false);
  const [orgReportPage, setOrgReportPage] = useState(1);
  const [orgReportLimit, setOrgReportLimit] = useState(10);
  const [orgReportTotal, setOrgReportTotal] = useState(0);
  const [orgReportYear, setOrgReportYear] = useState(currentYear);
  const [orgReportMonth, setOrgReportMonth] = useState(currentMonthNumber);

  const fetchOrgReport = async () => {
    if (!orgReportYear || !orgReportMonth) return;
    setOrgReportLoading(true);
    try {
      const params = {
        year: orgReportYear,
        month: orgReportMonth,
        page: orgReportPage,
        limit: orgReportLimit,
      };
      const response = await apiStatistika.OrganizationMonthlyReport(params);

      const items = extractReportList(response);
      const total = extractReportTotal(response);

      const formatted = (Array.isArray(items) ? items : []).map((item) => {
        const car = item.car || {};
        const driver = car.driver || {};
        const responsible = car.responsible_employee || {};
        const fuelsArr = Array.isArray(item.fuels) ? item.fuels : [];
        return {
          car_name:
            `${car.name || "Nomaʼlum"} ${car.plate_number || ""}`.trim(),
          driver_name: driver.full_name || "-",
          responsible_name: responsible.full_name || "-",
          total_mileage: Number(item.total_mileage) || 0,
          fuels: fuelsArr,
        };
      });

      setOrgReportData(formatted);
      setOrgReportTotal(total);
    } catch (err) {
      toastService.error(`Hisobotni yuklab bo'lmadi: ${err.message}`);
      setOrgReportData([]);
      setOrgReportTotal(0);
    } finally {
      setOrgReportLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgReportPage, orgReportLimit, orgReportYear, orgReportMonth]);

  const handleExportExcel = async () => {
    if (!orgReportYear || !orgReportMonth) return;
    try {
      const response = await apiStatistika.OrganizationMonthlyReportExcel({
        year: orgReportYear,
        month: orgReportMonth,
      });

      let filename = `tashkilot-oylik-hisobot-${orgReportYear}-${String(
        orgReportMonth,
      ).padStart(2, "0")}.xlsx`;

      const disposition = response.headers?.["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastService.success("Excel fayl yuklandi");
    } catch (err) {
      toastService.error(`Excel export qilib bo'lmadi: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(orgReportTotal / orgReportLimit) || 1;

  // Jadval ustunlari (har bir yoqilg'i turi uchun bitta ustun guruhi)
  const fuelColumns = useMemo(() => {
    const map = new Map();
    orgReportData.forEach((row) => {
      (row.fuels || []).forEach((f) => {
        if (!map.has(f.fuel_id)) {
          map.set(f.fuel_id, {
            fuel_id: f.fuel_id,
            fuel_name: f.fuel_name,
            fuel_unit: f.fuel_unit,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [orgReportData]);

  function getRowFuel(row, fuelId) {
    return (row.fuels || []).find((f) => f.fuel_id === fuelId) || null;
  }

  function rowTotalSum(row) {
    return (row.fuels || []).reduce(
      (acc, f) => acc + (Number(f.consumed_sum) || 0),
      0,
    );
  }

  // Jadvaldagi umumiy ustunlar soni (colSpan hisoblash uchun):
  // Mashina, Haydovchi, Mas'ul shaxs, Masofa, Umumiy summasi = 5 ta doimiy ustun
  // + har bir yoqilg'i turi uchun 4 tadan ustun (boshi, sarf miqdori, sarf summasi, oxiri)
  const fuelGroupCount = fuelColumns.length || 1;
  const totalColSpan = 5 + fuelColumns.length * 4;

  // guruh chegarasidagi ustunga qalinroq chap chiziq berish uchun umumiy props
  const groupDividerProps = {
    borderLeftWidth: groupDividerWidth,
    borderLeftColor: groupDividerColor,
  };

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

      {/* ============ 1) XODIMLAR VA MASHINALAR SONI (ENG TEPA) ============ */}
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

      {/* ============ 2) TASHKILOT BO'YICHA OYLIK HISOBOT (JADVAL) ============ */}
      <Card
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        overflow="hidden"
        mb={5}
      >
        <CardHeader>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            gap={4}
          >
            <Heading size="sm" color={headingColor}>
              Tashkilot bo'yicha oylik hisobot
            </Heading>
            <Spacer />
            <HStack spacing={3} wrap="wrap">
              <HStack spacing={1}>
                <Text fontSize="sm" color={subTextColor}>
                  Yil:
                </Text>
                <Select
                  value={orgReportYear}
                  onChange={(e) => setOrgReportYear(Number(e.target.value))}
                  size="sm"
                  w="100px"
                  bg={selectBg}
                  borderColor={selectBorder}
                  color={headingColor}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ),
                  )}
                </Select>
              </HStack>

              <HStack spacing={1}>
                <Text fontSize="sm" color={subTextColor}>
                  Oy:
                </Text>
                <Select
                  value={orgReportMonth}
                  onChange={(e) => setOrgReportMonth(Number(e.target.value))}
                  size="sm"
                  w="120px"
                  bg={selectBg}
                  borderColor={selectBorder}
                  color={headingColor}
                  fontWeight="medium"
                >
                  {MONTH_LABELS.map((label, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
              </HStack>

              <Button
                size="sm"
                colorScheme="green"
                variant="outline"
                onClick={handleExportExcel}
                leftIcon={<Download size={16} />}
              >
                Excel yuklash
              </Button>
            </HStack>
          </Flex>
        </CardHeader>

        <CardBody pt={0}>
          <TableContainer
            overflowX="auto"
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Table variant="simple" size="sm" bg={tableBg}>
              <Thead>
                <Tr>
                  <Th
                    rowSpan={2}
                    color={subTextColor}
                    borderColor={borderColor}
                    verticalAlign="bottom"
                  >
                    Mashina
                  </Th>
                  <Th
                    rowSpan={2}
                    color={subTextColor}
                    borderColor={borderColor}
                    verticalAlign="bottom"
                  >
                    Haydovchi
                  </Th>
                  <Th
                    rowSpan={2}
                    color={subTextColor}
                    borderColor={borderColor}
                    verticalAlign="bottom"
                  >
                    Mas'ul shaxs
                  </Th>
                  <Th
                    rowSpan={2}
                    color={subTextColor}
                    borderColor={borderColor}
                    verticalAlign="bottom"
                  >
                    Masofa (km)
                  </Th>

                  {/* --- OY BOSHIDAGI QOLDIQ (har bir yoqilg'i turi bo'yicha) --- */}
                  <Th
                    colSpan={fuelGroupCount}
                    textAlign="center"
                    color={headingColor}
                    borderColor={borderColor}
                    bg={fuelHeaderBg}
                    {...groupDividerProps}
                  >
                    Oy boshidagi qoldiq
                  </Th>

                  {/* --- OY DAVOMIDA SARFLANGAN (miqdor + summa, har bir yoqilg'i turi bo'yicha) --- */}
                  <Th
                    colSpan={fuelGroupCount * 2}
                    textAlign="center"
                    color={headingColor}
                    borderColor={borderColor}
                    bg={fuelHeaderBg}
                    {...groupDividerProps}
                  >
                    Oy davomida sarflangan
                  </Th>

                  <Th
                    rowSpan={2}
                    color={subTextColor}
                    borderColor={borderColor}
                    verticalAlign="bottom"
                    {...groupDividerProps}
                  >
                    Umumiy summasi
                  </Th>

                  {/* --- OY OXIRIDAGI QOLDIQ (har bir yoqilg'i turi bo'yicha) --- */}
                  <Th
                    colSpan={fuelGroupCount}
                    textAlign="center"
                    color={headingColor}
                    borderColor={borderColor}
                    bg={fuelHeaderBg}
                    {...groupDividerProps}
                  >
                    Oy oxiridagi qoldiq
                  </Th>
                </Tr>
                <Tr>
                  {/* Boshidagi qoldiq - har bir yoqilg'i */}
                  {fuelColumns.map((f, idx) => (
                    <Th
                      key={`start-${f.fuel_id}`}
                      color={subTextColor}
                      borderColor={borderColor}
                      fontSize="10px"
                      {...(idx === 0 ? groupDividerProps : {})}
                    >
                      {f.fuel_name} ({f.fuel_unit})
                    </Th>
                  ))}
                  {/* Sarflangan miqdor va summa - har bir yoqilg'i */}
                  {fuelColumns.map((f, idx) => (
                    <>
                      <Th
                        key={`consumed-${f.fuel_id}`}
                        color={subTextColor}
                        borderColor={borderColor}
                        fontSize="10px"
                        {...(idx === 0 ? groupDividerProps : {})}
                      >
                        {f.fuel_name} sarfi ({f.fuel_unit})
                      </Th>
                      <Th
                        key={`sum-${f.fuel_id}`}
                        color={subTextColor}
                        borderColor={borderColor}
                        fontSize="10px"
                      >
                        {f.fuel_name} summasi
                      </Th>
                    </>
                  ))}
                  {/* Oxirgi qoldiq - har bir yoqilg'i */}
                  {fuelColumns.map((f, idx) => (
                    <Th
                      key={`end-${f.fuel_id}`}
                      color={subTextColor}
                      borderColor={borderColor}
                      fontSize="10px"
                      {...(idx === 0 ? groupDividerProps : {})}
                    >
                      {f.fuel_name} ({f.fuel_unit})
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {orgReportLoading ? (
                  [...Array(orgReportLimit)].map((_, i) => (
                    <Tr key={i}>
                      <Td colSpan={totalColSpan} borderColor={borderColor}>
                        <Skeleton h="20px" w="full" />
                      </Td>
                    </Tr>
                  ))
                ) : orgReportData.length === 0 ? (
                  <Tr>
                    <Td
                      colSpan={totalColSpan}
                      textAlign="center"
                      color={emptyTextColor}
                      py={8}
                    >
                      Ma'lumot topilmadi
                    </Td>
                  </Tr>
                ) : (
                  orgReportData.map((row, idx) => (
                    <Tr key={idx} _hover={{ bg: tableHoverBg }}>
                      <Td borderColor={borderColor} color={headingColor}>
                        {row.car_name}
                      </Td>
                      <Td borderColor={borderColor} color={headingColor}>
                        {row.driver_name}
                      </Td>
                      <Td borderColor={borderColor} color={headingColor}>
                        {row.responsible_name}
                      </Td>
                      <Td borderColor={borderColor} color={headingColor}>
                        {formatNumberSimple(row.total_mileage)} km
                      </Td>

                      {/* Boshidagi qoldiq - har bir yoqilg'i */}
                      {fuelColumns.map((f, fIdx) => {
                        const rf = getRowFuel(row, f.fuel_id);
                        return (
                          <Td
                            key={`start-${f.fuel_id}`}
                            borderColor={borderColor}
                            color={headingColor}
                            {...(fIdx === 0 ? groupDividerProps : {})}
                          >
                            {rf ? formatNumberSimple(rf.start_balance) : "-"}
                          </Td>
                        );
                      })}

                      {/* Sarflangan miqdor va summa - har bir yoqilg'i */}
                      {fuelColumns.map((f, fIdx) => {
                        const rf = getRowFuel(row, f.fuel_id);
                        return (
                          <>
                            <Td
                              key={`consumed-${f.fuel_id}`}
                              borderColor={borderColor}
                              color={headingColor}
                              {...(fIdx === 0 ? groupDividerProps : {})}
                            >
                              {rf
                                ? formatNumberSimple(rf.consumed_amount)
                                : "-"}
                            </Td>
                            <Td
                              key={`sum-${f.fuel_id}`}
                              borderColor={borderColor}
                              color={headingColor}
                            >
                              {rf ? formatSum(rf.consumed_sum) : "-"}
                            </Td>
                          </>
                        );
                      })}

                      <Td
                        borderColor={borderColor}
                        color={headingColor}
                        fontWeight="semibold"
                        {...groupDividerProps}
                      >
                        {formatSum(rowTotalSum(row))}
                      </Td>

                      {/* Oxirgi qoldiq - har bir yoqilg'i */}
                      {fuelColumns.map((f, fIdx) => {
                        const rf = getRowFuel(row, f.fuel_id);
                        return (
                          <Td
                            key={`end-${f.fuel_id}`}
                            borderColor={borderColor}
                            color={headingColor}
                            {...(fIdx === 0 ? groupDividerProps : {})}
                          >
                            {rf ? formatNumberSimple(rf.end_balance) : "-"}
                          </Td>
                        );
                      })}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {!orgReportLoading && orgReportTotal > 0 && (
            <Flex justify="space-between" align="center" mt={4}>
              <Text color={subTextColor} fontSize="sm">
                Jami: {formatNumberSimple(orgReportTotal)} ta
              </Text>
              <HStack spacing={1}>
                <IconButton
                  size="sm"
                  icon={<ChevronLeft size={18} />}
                  onClick={() => setOrgReportPage((p) => Math.max(p - 1, 1))}
                  isDisabled={orgReportPage === 1}
                  variant="outline"
                  borderColor={selectBorder}
                  color={headingColor}
                  aria-label="Oldingi sahifa"
                />
                <Text fontSize="sm" color={headingColor} px={2}>
                  {orgReportPage} / {totalPages}
                </Text>
                <IconButton
                  size="sm"
                  icon={<ChevronRight size={18} />}
                  onClick={() =>
                    setOrgReportPage((p) => Math.min(p + 1, totalPages))
                  }
                  isDisabled={orgReportPage === totalPages}
                  variant="outline"
                  borderColor={selectBorder}
                  color={headingColor}
                  aria-label="Keyingi sahifa"
                />
                <Select
                  size="sm"
                  w="80px"
                  value={orgReportLimit}
                  onChange={(e) => {
                    setOrgReportLimit(Number(e.target.value));
                    setOrgReportPage(1);
                  }}
                  bg={selectBg}
                  borderColor={selectBorder}
                  color={headingColor}
                >
                  {[5, 10, 20, 50].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </HStack>
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* ============ 3) YILLIK XARAJAT VA YOQILG'I SARFI DINAMIKASI ============ */}
      <Card
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        overflow="hidden"
        mb={5}
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
