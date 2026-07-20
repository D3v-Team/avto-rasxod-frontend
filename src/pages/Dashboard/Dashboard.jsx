import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  Badge,
  Text,
  Avatar,
  useColorModeValue,
} from "@chakra-ui/react";
import { Car, Fuel, Wallet2, Gauge, TrendingUp } from "lucide-react";
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

const vehicles = [
  {
    name: "KIA Sportage",
    plate: "20 095 DAV",
    driver: "Р.Турсунмурадов",
    litr: 3541,
    summa: 2729824,
    benzin: 30,
    gaz: 30,
  },
  {
    name: "Tracker",
    plate: "20/227 TAA",
    driver: "Б.Хамидов",
    litr: 2314,
    summa: 1494000,
    benzin: 0,
    gaz: 228,
  },
  {
    name: "Tracker 2",
    plate: "20/226 SAA",
    driver: "Т.Шодмонов",
    litr: 2411,
    summa: 1254000,
    benzin: 10,
    gaz: 163,
  },
  {
    name: "Lacetti 1.8",
    plate: "20/227 FAA",
    driver: "Т.Номозов",
    litr: 1669,
    summa: 1017500,
    benzin: 5,
    gaz: 185,
  },
  {
    name: "Lacetti 1.5",
    plate: "20/226 AAA",
    driver: "У.Манғитов",
    litr: 1515,
    summa: 1021000,
    benzin: 0,
    gaz: 142,
  },
  {
    name: "Cobalt",
    plate: "20/854 XAA",
    driver: "Ж.Файзиев",
    litr: 1793,
    summa: 1273932,
    benzin: 153,
    gaz: 0,
  },
];

// Yagona ohang — sof ko'k
const ACCENT = "#3B82F6"; // asosiy ko'k
const ACCENT_SOFT = "#93C5FD"; // yorug' ko'k

function formatSum(n) {
  return n.toLocaleString("ru-RU") + " so'm";
}

function StatCard({ label, value, helpText, icon }) {
  return (
    <Card
      variant="elevated"
      bg="surface"
      border="1px solid"
      borderColor="border"
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" top={0} left={0} right={0} h="3px" bg={ACCENT} />
      <CardBody>
        <Flex justify="space-between" align="flex-start">
          <Stat>
            <StatLabel color="textSecondary" fontSize="sm" fontWeight="500">
              {label}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="700" color="text" mt={1}>
              {value}
            </StatNumber>
            <StatHelpText mb={0} color="muted" fontSize="xs">
              {helpText}
            </StatHelpText>
          </Stat>
          <Flex
            bg={ACCENT}
            p={3}
            borderRadius="xl"
            color="white"
            boxShadow={`0 6px 16px ${ACCENT}40`}
          >
            <Icon as={icon} boxSize={5} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function Dashboard() {
  const totalLitr = vehicles.reduce((s, v) => s + v.litr, 0);
  const totalSumma = vehicles.reduce((s, v) => s + v.summa, 0);
  const totalBenzin = vehicles.reduce((s, v) => s + v.benzin, 0);
  const totalGaz = vehicles.reduce((s, v) => s + v.gaz, 0);
  const avgPerVehicle = Math.round(totalSumma / vehicles.length);
  const maxSpender = [...vehicles].sort((a, b) => b.summa - a.summa)[0];

  const fuelTypeData = [
    { name: "Benzin", value: totalBenzin },
    { name: "Gaz", value: totalGaz },
  ];

  const gridBg = useColorModeValue("#e7e5e4", "#44403c");

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
            Avtomobil yoqilg'i hisoboti — Iyun 2026
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

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={5} mb={8}>
        <StatCard
          label="Avtomobillar"
          value={vehicles.length}
          helpText="Balansdagi transport"
          icon={Car}
        />
        <StatCard
          label="Umumiy yoqilg'i"
          value={`${totalLitr.toLocaleString("ru-RU")} L`}
          helpText="Iyun oyi jami"
          icon={Fuel}
        />
        <StatCard
          label="Umumiy xarajat"
          value={`${(totalSumma / 1000000).toFixed(1)} mln`}
          helpText={formatSum(totalSumma)}
          icon={Wallet2}
        />
        <StatCard
          label="O'rtacha xarajat"
          value={`${(avgPerVehicle / 1000).toFixed(0)}k`}
          helpText="Har bir avtomobil uchun"
          icon={Gauge}
        />
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
                    Yetakchi: {maxSpender.name}
                  </Text>
                </Flex>
              </Box>
              <Badge variant="soft">so'm</Badge>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
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
                <Tr key={v.plate}>
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
        </CardBody>
      </Card>
    </Box>
  );
}

export default Dashboard;
