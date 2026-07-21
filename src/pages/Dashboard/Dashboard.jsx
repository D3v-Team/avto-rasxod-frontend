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
  Icon,
  Center,
  Badge,
  Text,
  Avatar,
  Skeleton,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { Fuel, Wallet, TrendingUp, Route } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Avtomobillar ro'yxati — hozircha statik (name/plate/driver), lekin har
// biriga `id` (backenddagi car_id) biriktirilgan, chunki oylik hisobot
// GET /car-daily-expenses/monthly-report/{car_id}/{fuel_id} shu id orqali
// so'raladi. Agar loyihada alohida "avtomobillar ro'yxati" API'si bo'lsa,
// bu massivni o'sha endpointdan kelgan ma'lumot bilan almashtirish kifoya —
// pastdagi statistika hisoblash logikasi o'zgarmaydi, faqat `id` va
// name/plate/driver maydonlari kerak.
// ---------------------------------------------------------------------------
const VEHICLES_BASE = [
  {
    id: "1",
    name: "KIA Sportage",
    plate: "20 095 DAV",
    driver: "Р.Турсунмурадов",
  },
  { id: "2", name: "Tracker", plate: "20/227 TAA", driver: "Б.Хамидов" },
  { id: "3", name: "Tracker 2", plate: "20/226 SAA", driver: "Т.Шодмонов" },
  { id: "4", name: "Lacetti 1.8", plate: "20/227 FAA", driver: "Т.Номозов" },
  { id: "5", name: "Lacetti 1.5", plate: "20/226 AAA", driver: "У.Манғитов" },
  { id: "6", name: "Cobalt", plate: "20/854 XAA", driver: "Ж.Файзиев" },
];

// Backendda yoqilg'i turlari uchun alohida ro'yxat endpointi bo'lmagani
// sababli hozircha shu yerda belgilangan (CostPage.jsx dagi bilan bir xil).
// Haqiqiy loyihada bu ID'lar backenddagi fuel jadvalidagi UUID'lar bilan
// almashtirilishi kerak.
const FUEL_TYPES = [
  { id: "benzin", label: "Benzin" },
  { id: "gaz", label: "Gaz" },
];

// Yagona ohang — sof ko'k
const ACCENT = "#3B82F6";
const ACCENT_SOFT = "#93C5FD";

function formatSum(n) {
  return (Number(n) || 0).toLocaleString("ru-RU") + " so'm";
}

function formatNumberSimple(n) {
  return (Number(n) || 0).toLocaleString("uz-UZ");
}

// Backend javobida field nomi turlicha bo'lishi mumkinligi sababli
// bir nechta ehtimoliy nomdan birinchi topilganini olamiz.
function pick(obj, keys, fallback = 0) {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
}

// Oylik yoqilg'i statistikasi kartasi (Qoldiq balans / Benzin sarfi /
// Gaz sarfi / Jami kilometraj) — endi qiymatlar apiCost.MonthlyReport
// natijalaridan hisoblanadi.
function FuelStatCard({ icon: IconCmp, label, value, suffix, colorScheme }) {
  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="surface"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border"
      p={6}
      transition="all 0.25s ease"
      _hover={{
        borderColor: `${colorScheme}.400`,
        transform: "translateY(-2px)",
        boxShadow: "lg",
      }}
    >
      <Box
        position="absolute"
        top="-30px"
        right="-30px"
        boxSize="110px"
        borderRadius="full"
        bg={`${colorScheme}.500`}
        opacity={0.08}
      />
      <Flex justify="space-between" align="flex-start" position="relative">
        <Stat>
          <StatLabel
            color="textSecondary"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="wider"
          >
            {label.toUpperCase()}
          </StatLabel>
          <StatNumber fontSize="3xl" color="text" fontWeight="extrabold" mt={1}>
            {value}
            {suffix && (
              <Text
                as="span"
                fontSize="md"
                color="textSecondary"
                ml={1}
                fontWeight="medium"
              >
                {suffix}
              </Text>
            )}
          </StatNumber>
        </Stat>
        <Center
          bg={`${colorScheme}.500`}
          borderRadius="xl"
          boxSize="46px"
          flexShrink={0}
          boxShadow={`0 8px 20px -6px var(--chakra-colors-${colorScheme}-500)`}
        >
          <IconCmp size={22} color="white" />
        </Center>
      </Flex>
    </Box>
  );
}

function Dashboard() {
  const toast = useToast();
  const gridBg = useColorModeValue("#e7e5e4", "#44403c");

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [vehicles, setVehicles] = useState(
    VEHICLES_BASE.map((v) => ({
      ...v,
      litr: 0,
      summa: 0,
      benzin: 0,
      gaz: 0,
      km: 0,
      balance: 0,
    })),
  );
  const [loading, setLoading] = useState(true);

  // --- Har bir avtomobil + har bir yoqilg'i turi bo'yicha oylik hisobotni
  // yuklab, jadval/grafik/statistika kartalari uchun bitta shaklga keltiramiz.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadAll = async () => {
      const results = await Promise.all(
        VEHICLES_BASE.map(async (vehicle) => {
          const perFuel = await Promise.all(
            FUEL_TYPES.map(async (fuel) => {
              try {
                const data = await apiCost.MonthlyReport(
                  vehicle.id,
                  fuel.id,
                  currentMonth,
                );
                return {
                  fuelId: fuel.id,
                  expense: pick(data, [
                    "total_expense",
                    "fuel_expence",
                    "expense",
                  ]),
                  sum: pick(data, ["total_sum", "fuel_price_sum", "sum"]),
                  mileage: pick(data, ["total_mileage", "mileage"]),
                  balance: pick(data, ["balance", "remainder"]),
                };
              } catch (err) {
                // 404 (hisobot topilmadi) yoki boshqa xatoda 0 qiymat bilan davom etamiz
                return {
                  fuelId: fuel.id,
                  expense: 0,
                  sum: 0,
                  mileage: 0,
                  balance: 0,
                };
              }
            }),
          );

          const benzinData = perFuel.find((f) => f.fuelId === "benzin");
          const gazData = perFuel.find((f) => f.fuelId === "gaz");

          return {
            ...vehicle,
            benzin: benzinData?.expense || 0,
            gaz: gazData?.expense || 0,
            litr: (benzinData?.expense || 0) + (gazData?.expense || 0),
            summa: (benzinData?.sum || 0) + (gazData?.sum || 0),
            km: Math.max(benzinData?.mileage || 0, gazData?.mileage || 0),
            balance: (benzinData?.balance || 0) + (gazData?.balance || 0),
          };
        }),
      );

      if (cancelled) return;
      setVehicles(results);
      setLoading(false);
    };

    loadAll().catch((err) => {
      if (cancelled) return;
      toast({
        title: "Statistikani yuklab bo'lmadi",
        description: err.message,
        status: "error",
        duration: 4000,
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentMonth, toast]);

  const totalLitr = vehicles.reduce((s, v) => s + v.litr, 0);
  const totalBenzin = vehicles.reduce((s, v) => s + v.benzin, 0);
  const totalGaz = vehicles.reduce((s, v) => s + v.gaz, 0);
  const totalKm = vehicles.reduce((s, v) => s + v.km, 0);
  const totalBalance = vehicles.reduce((s, v) => s + v.balance, 0);
  const maxSpender = vehicles.length
    ? [...vehicles].sort((a, b) => b.summa - a.summa)[0]
    : null;

  const fuelTypeData = [
    { name: "Benzin", value: totalBenzin },
    { name: "Gaz", value: totalGaz },
  ];

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* PAGE HEADER */}
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        mb={6}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Box>
          <Heading size="lg" color="text">
            Dashboard
          </Heading>
          <Text color="textSecondary" fontSize="sm" mt={1}>
            Avtomobil yoqilg'i hisoboti — {currentMonth}
          </Text>
        </Box>
        <Badge variant="soft" fontSize="sm">
          {new Date().toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Badge>
      </Flex>

      {/* Oylik yoqilg'i statistikasi — apiCost.MonthlyReport asosida */}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={5} mb={6}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} height="118px" borderRadius="2xl" />
          ))
        ) : (
          <>
            <FuelStatCard
              icon={Wallet}
              label="Qoldiq balans"
              value={formatNumberSimple(totalBalance)}
              suffix="l"
              colorScheme="green"
            />
            <FuelStatCard
              icon={Fuel}
              label="Benzin sarfi (oy)"
              value={formatNumberSimple(totalBenzin)}
              suffix="l"
              colorScheme="amber"
            />
            <FuelStatCard
              icon={Fuel}
              label="Gaz sarfi (oy)"
              value={formatNumberSimple(totalGaz)}
              suffix="l"
              colorScheme="secondary"
            />
            <FuelStatCard
              icon={Route}
              label="Jami kilometraj"
              value={formatNumberSimple(totalKm)}
              suffix="km"
              colorScheme="accent"
            />
          </>
        )}
      </SimpleGrid>

      {/* CHARTS */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={8}>
        <Card bg="surface" border="1px solid" borderColor="border">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="sm" color="text">
                  Avtomobillar bo'yicha xarajat
                </Heading>
                <Flex align="center" gap={1} mt={1}>
                  <Icon as={TrendingUp} boxSize={3.5} color={ACCENT} />
                  <Text fontSize="xs" color="textSecondary">
                    Yetakchi: {maxSpender ? maxSpender.name : "—"}
                  </Text>
                </Flex>
              </Box>
              <Badge variant="soft">so'm</Badge>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            {loading ? (
              <Skeleton height="290px" borderRadius="lg" />
            ) : (
              <Box h="290px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicles} barSize={38}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridBg}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => formatSum(v)}
                      cursor={{ fill: `${ACCENT}10` }}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e7e5e4",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="summa" radius={[8, 8, 0, 0]} fill={ACCENT} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardBody>
        </Card>

        <Card bg="surface" border="1px solid" borderColor="border">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm" color="text">
                Yoqilg'i turi bo'yicha taqsimot
              </Heading>
              <Badge variant="soft">Litr</Badge>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            {loading ? (
              <Skeleton height="290px" borderRadius="lg" />
            ) : (
              <Box h="290px" position="relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelTypeData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={4}
                      cornerRadius={8}
                    >
                      <Cell fill={ACCENT} />
                      <Cell fill={ACCENT_SOFT} />
                    </Pie>
                    <Tooltip
                      formatter={(v) => `${v} L`}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e7e5e4",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  position="absolute"
                  top="42%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  textAlign="center"
                >
                  <Text fontSize="xl" fontWeight="700" color="text">
                    {totalLitr}
                  </Text>
                  <Text fontSize="xs" color="muted">
                    jami litr
                  </Text>
                </Box>
              </Box>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* TABLE */}
      <Card bg="surface" border="1px solid" borderColor="border">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="sm" color="text">
              Avtomobillar ro'yxati
            </Heading>
            <Badge variant="soft" fontSize="xs">
              {vehicles.length} TA
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody pt={0} overflowX="auto">
          {loading ? (
            <Box py={4}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height="42px" my={2} borderRadius="md" />
              ))}
            </Box>
          ) : (
            <Table variant="modern">
              <Thead>
                <Tr>
                  <Th>Avtomobil</Th>
                  <Th>Davlat raqami</Th>
                  <Th>Haydovchi</Th>
                  <Th isNumeric>Yoqilg'i (L)</Th>
                  <Th isNumeric>Summa</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vehicles.map((v) => (
                  <Tr key={v.id}>
                    <Td>
                      <Flex align="center" gap={3}>
                        <Avatar
                          size="sm"
                          name={v.name}
                          bg={ACCENT}
                          color="white"
                          fontSize="xs"
                        />
                        <Text fontWeight="600" color="text">
                          {v.name}
                        </Text>
                      </Flex>
                    </Td>
                    <Td color="textSecondary">{v.plate}</Td>
                    <Td color="textSecondary">{v.driver}</Td>
                    <Td isNumeric color="textSecondary">
                      {v.litr.toLocaleString("ru-RU")}
                    </Td>
                    <Td isNumeric fontWeight="600" color="text">
                      {formatSum(v.summa)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}

export default Dashboard;
