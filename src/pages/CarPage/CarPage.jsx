import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  useDisclosure,
  Tooltip,
  Spinner,
  Center,
  VStack,
  HStack,
  Switch,
} from "@chakra-ui/react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Car as CarIcon,
  Gauge,
  Fuel,
  Zap,
} from "lucide-react";
import { apiCars } from "../../Services/api/Cars";
import { apiEmployees } from "../../Services/api/Users";
import { apiFuel } from "../../Services/api/Fuels";

const ACCENT = "#3B82F6";

// 🔋 Backend hozircha is_electric maydonini qaytarmaydi/saqlamaydi,
// shu sababli buni frontendda localStorage orqali saqlab turamiz.
const ELECTRIC_STORAGE_KEY = "car_electric_status_map";

const getElectricMap = () => {
  try {
    const raw = localStorage.getItem(ELECTRIC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Elektromobil holatini o'qishda xatolik:", error);
    return {};
  }
};

const setElectricStatus = (carId, isElectric) => {
  if (!carId) return;
  try {
    const map = getElectricMap();
    map[carId] = Boolean(isElectric);
    localStorage.setItem(ELECTRIC_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Elektromobil holatini saqlashda xatolik:", error);
  }
};

const removeElectricStatus = (carId) => {
  if (!carId) return;
  try {
    const map = getElectricMap();
    delete map[carId];
    localStorage.setItem(ELECTRIC_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Elektromobil holatini o'chirishda xatolik:", error);
  }
};

const initialFormState = {
  name: "",
  plate_number: "",
  responsible_employee_id: "",
  driver_id: "",
  speedometer: "",
  is_electric: false, // ⚡ ELEKTROMOBIL BAYROQCHASI
  is_active: true,
};

const initialNormState = {
  car_id: "",
  fuel_id: "",
  norm_per_100km: "",
};

export default function CarPage() {
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [fuels, setFuels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [normFormData, setNormFormData] = useState(initialNormState);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carToDelete, setCarToDelete] = useState(null);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isNormOpen,
    onOpen: onNormOpen,
    onClose: onNormClose,
  } = useDisclosure();

  const extractRecords = (res) => {
    const payload = res?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchEmployeesByRole = async () => {
    try {
      const [driversRes, responsiblesRes] = await Promise.all([
        apiEmployees.Filter("driver", "", 1, 100),
        apiEmployees.Filter("responsible", "", 1, 100),
      ]);

      setDrivers(extractRecords(driversRes));
      setResponsibles(extractRecords(responsiblesRes));
    } catch (error) {
      console.error("Xodimlarni yuklashda xatolik:", error);
      setDrivers([]);
      setResponsibles([]);
    }
  };

  const fetchFuels = async () => {
    try {
      const res = await apiFuel.All(1, 100);
      setFuels(extractRecords(res));
    } catch (error) {
      console.error("Yonilg'i turlarini yuklashda xatolik:", error);
      setFuels([]);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await apiCars.All(1, 100, search);
      const rawData = extractRecords(res);
      const electricMap = getElectricMap();

      const mappedCars = rawData.map((car) => {
        let driverName = "Biriktirilmagan";
        if (car.driver && typeof car.driver === "object") {
          driverName =
            car.driver.full_name || car.driver.login || "Ismsiz xodim";
        } else if (car.driver_info && typeof car.driver_info === "object") {
          driverName = car.driver_info.full_name || "Ismsiz xodim";
        } else if (typeof car.driver === "string") {
          driverName = car.driver;
        }

        let responsibleName = "Biriktirilmagan";
        if (
          car.responsible_employee &&
          typeof car.responsible_employee === "object"
        ) {
          responsibleName =
            car.responsible_employee.full_name ||
            car.responsible_employee.login ||
            "Ismsiz xodim";
        } else if (typeof car.responsible_employee === "string") {
          responsibleName = car.responsible_employee;
        }

        // Backend is_electric ni qaytarmasa ham, localStorage'da saqlangan
        // qiymat bo'lsa o'shani ustuvor qilib olamiz.
        const localElectric = electricMap[car.id];
        const isElectric =
          localElectric !== undefined
            ? Boolean(localElectric)
            : Boolean(car.is_electric);

        return {
          id: car.id,
          name: car.name || car.car_name || "Nomsiz transport",
          plate_number: car.plate_number || car.plate || car.state_number || "",
          driver_name: driverName,
          driver_id:
            car.driver && typeof car.driver === "object"
              ? car.driver.id
              : car.driver_id || "",
          responsible_name: responsibleName,
          responsible_employee_id:
            car.responsible_employee &&
            typeof car.responsible_employee === "object"
              ? car.responsible_employee.id
              : car.responsible_employee_id || "",

          speedometer: Number(car.speedometer || 0),
          is_electric: isElectric, // Elektromobil statusi (local + backend)
          is_active:
            car.is_active !== undefined ? Boolean(car.is_active) : true,
        };
      });

      setCars(mappedCars);
    } catch (error) {
      console.error("Avtomobillarni yuklashda xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesByRole();
    fetchFuels();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCars();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOpenCreate = () => {
    setSelectedCarId(null);
    setFormData(initialFormState);
    onFormOpen();
  };

  const handleOpenEdit = (car) => {
    setSelectedCarId(car.id);
    setFormData({
      name: car.name || "",
      plate_number: car.plate_number || "",
      responsible_employee_id: car.responsible_employee_id || "",
      driver_id: car.driver_id || "",
      speedometer: car.speedometer || "",
      is_electric: Boolean(car.is_electric),
      is_active: car.is_active ?? true,
    });
    onFormOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.plate_number.trim()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      plate_number: formData.plate_number,
      responsible_employee_id: formData.responsible_employee_id || null,
      driver_id: formData.driver_id || null,
      speedometer: Number(formData.speedometer) || 0,
      is_electric: Boolean(formData.is_electric),
      is_active: Boolean(formData.is_active),
    };

    try {
      if (selectedCarId) {
        await apiCars.Update(selectedCarId, payload);
        // Backend is_electric ni saqlamasa ham, frontendda holatni saqlaymiz
        setElectricStatus(selectedCarId, formData.is_electric);
      } else {
        const createRes = await apiCars.Create(payload);
        // Yangi yaratilgan avtomobil id sini turli mumkin bo'lgan
        // javob strukturalaridan topishga harakat qilamiz
        const newCarId =
          createRes?.data?.id ??
          createRes?.data?.data?.id ??
          createRes?.data?.record?.id ??
          createRes?.data?.data?.record?.id;

        if (newCarId) {
          setElectricStatus(newCarId, formData.is_electric);
        }
      }
      onFormClose();
      fetchCars();
    } catch (error) {
      console.error("Saqlashda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNormModal = (car) => {
    setSelectedCar(car);
    setNormFormData({
      car_id: car.id,
      fuel_id: "",
      norm_per_100km: "",
    });
    onNormOpen();
  };

  const handleNormSubmit = async (e) => {
    e.preventDefault();

    if (!normFormData.fuel_id || !normFormData.norm_per_100km) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      car_id: normFormData.car_id,
      fuel_id: normFormData.fuel_id,
      norm_per_100km: Number(normFormData.norm_per_100km),
    };

    try {
      await apiCars.CreateNorm(payload);
      onNormClose();
    } catch (error) {
      console.error("Norma saqlashda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (car) => {
    setCarToDelete(car);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!carToDelete?.id) return;
    setIsSubmitting(true);
    try {
      await apiCars.Delete(carToDelete.id);
      removeElectricStatus(carToDelete.id);
      onDeleteClose();
      fetchCars();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔢 Davlat raqamini "20 | 200 DAV" ko'rinishida (raqam va harflar orasida bo'sh joy bilan) formatlaydi
  const formatPlateNumber = (plate) => {
    if (!plate) return { region: "01", main: "" };
    const clean = plate.replace(/\s+/g, "").toUpperCase();
    const region = clean.slice(0, 2);
    const rest = clean.slice(2);
    const formattedMain = rest
      .replace(/(\d+)([A-Z]+)/g, "$1 $2")
      .replace(/([A-Z]+)(\d+)/g, "$1 $2");

    return { region, main: formattedMain };
  };

  return (
    <Box
      bg="bg"
      minH="100vh"
      w="100%"
      p={{ base: 4, md: 6 }}
      transition="background 0.2s ease"
    >
      <Box w="100%">
        {/* PAGE HEADER */}
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexWrap="wrap"
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="text" fontWeight="600">
              Avtomobillar
            </Heading>
            <Text color="textSecondary" fontSize="sm">
              Tizimdagi barcha transport vositalari va ularning ko'rsatkichlari
            </Text>
          </VStack>

          <Button
            leftIcon={<Plus size={18} />}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            _active={{ bg: "#1D4ED8" }}
            onClick={handleOpenCreate}
            px={6}
            boxShadow="sm"
            borderRadius="lg"
          >
            Yangi avtomobil
          </Button>
        </Flex>

        {/* SEARCH + COUNT ROW */}
        <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={5}>
          <InputGroup maxW="320px">
            <InputLeftElement pointerEvents="none">
              <Search size={17} color="var(--chakra-colors-textSecondary)" />
            </InputLeftElement>
            <Input
              placeholder="Qidirish..."
              bg="surface"
              border="1px solid"
              borderColor="border"
              color="text"
              borderRadius="lg"
              _hover={{ borderColor: ACCENT }}
              _focus={{
                borderColor: ACCENT,
                boxShadow: `0 0 0 3px ${ACCENT}26`,
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Badge
            fontSize="xs"
            px={3}
            py={1.5}
            borderRadius="lg"
            bg="blackAlpha.50"
            color="textSecondary"
            border="1px solid"
            borderColor="border"
          >
            Jami: {cars.length} ta
          </Badge>
        </Flex>

        {/* TABLE CARD SECTION */}
        <Card
          bg="surface"
          border="1px solid"
          borderColor="border"
          borderRadius="xl"
          boxShadow="sm"
        >
          <CardBody p={0}>
            {loading ? (
              <Center py={16}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="primary" thickness="3px" />
                  <Text color="textSecondary" fontSize="sm" fontWeight="medium">
                    Ma'lumotlar yuklanmoqda...
                  </Text>
                </VStack>
              </Center>
            ) : cars.length === 0 ? (
              <Center py={16}>
                <VStack spacing={3}>
                  <CarIcon
                    size={40}
                    opacity={0.3}
                    color="var(--chakra-colors-textSecondary)"
                  />
                  <Text color="text" fontSize="md">
                    Avtomobil topilmadi
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr bg="surfBlur">
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={4}
                        pl={6}
                      >
                        Avtomobil nomi
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Davlat raqami
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Haydovchi
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Mas'ul xodim
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Speedometer
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Holati
                      </Th>
                      <Th
                        textAlign="center"
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        pr={6}
                      >
                        Amallar
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {cars.map((car) => (
                      <Tr
                        key={car.id}
                        transition="all 0.2s ease"
                        _hover={{
                          bg: "blackAlpha.50",
                          transform: "translateY(-1px)",
                        }}
                      >
                        {/* 1. Avtomobil Nomi va Jonli Icon */}
                        <Td borderColor="border" pl={6} py={4}>
                          <HStack spacing={3}>
                            <Center
                              w="38px"
                              h="38px"
                              borderRadius="xl"
                              bgGradient={`linear(to-br, ${car.is_electric ? "#10B98120" : ACCENT + "20"}, ${car.is_electric ? "#10B98108" : ACCENT + "08"})`}
                              border="1px solid"
                              borderColor={
                                car.is_electric ? "#10B98130" : `${ACCENT}30`
                              }
                              boxShadow={`0 2px 8px ${car.is_electric ? "#10B98120" : ACCENT + "20"}`}
                              color={car.is_electric ? "green.500" : ACCENT}
                              transition="all 0.2s"
                              _hover={{ transform: "scale(1.05)" }}
                            >
                              <CarIcon size={20} strokeWidth={2.2} />
                            </Center>
                            <VStack align="start" spacing={0}>
                              <HStack spacing={1.5}>
                                <Text
                                  fontWeight="600"
                                  color="text"
                                  fontSize="sm"
                                >
                                  {car.name}
                                </Text>
                               
                              </HStack>
                              <Text fontSize="xs" color="textSecondary">
                                Transport
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>

                      
<Td>
  <Flex
    align="center"
    bg="white"
    color="black"
    border="1.5px solid #000"
    borderRadius="lg"
    overflow="hidden"
    h="32px"
    w="fit-content"
    userSelect="none"
  >
    {/* 1. Viloyat kodi (is_electric bo'lsa YASHIL, aks holda OQ) */}
    <Center
      bg={car.is_electric ? "#70C837" : "white"}
      px={2}
      h="100%"
    >
      <Text
        fontWeight="800"
        fontSize="xs"
        lineHeight="1"
        fontFamily="monospace"
        color="black"
      >
        {formatPlateNumber(car.plate_number).region}
      </Text>
    </Center>

    {/* Tik ajratuvchi chiziq */}
    <Box w="1.5px" bg="#000" alignSelf="stretch" />

    {/* 2. Asosiy Raqam qismi (raqam va harflar orasida bo'sh joy bilan) */}
    <Center px={2.5} h="100%">
      <Text
        fontWeight="800"
        fontSize="xs"
        fontFamily="monospace"
        letterSpacing="1px"
        textTransform="uppercase"
        color="black"
        whiteSpace="pre"
      >
        {formatPlateNumber(car.plate_number).main}
      </Text>
    </Center>

    {/* 3. Bayroqcha va UZ */}
    <VStack spacing={0} align="center" pl={0.5} pr={1.5} justify="center">
      <Text fontSize="9px" lineHeight="1">
        🇺🇿
      </Text>
      <Text
        fontSize="6.5px"
        fontWeight="900"
        color="#0033A0"
        lineHeight="1"
        mt="1px"
      >
        UZ
      </Text>
    </VStack>
  </Flex>
</Td>


                        {/* 3. Haydovchi */}
                        <Td borderColor="border">
                          <Text color="text" fontSize="sm" fontWeight="500">
                            {car.driver_name}
                          </Text>
                        </Td>

                        {/* 4. Mas'ul Xodim */}
                        <Td borderColor="border">
                          <Text color="textSecondary" fontSize="sm">
                            {car.responsible_name}
                          </Text>
                        </Td>

                        {/* 5. Speedometer */}
                        <Td borderColor="border">
                          <HStack
                            spacing={2}
                            bg="blackAlpha.50"
                            px={2.5}
                            py={1}
                            borderRadius="lg"
                            display="inline-flex"
                            border="1px solid"
                            borderColor="border"
                          >
                            <Gauge
                              size={14}
                              color="var(--chakra-colors-textSecondary)"
                            />
                            <Text color="text" fontSize="xs" fontWeight="600">
                              {car.speedometer
                                ? car.speedometer.toLocaleString("uz-UZ")
                                : 0}{" "}
                              km
                            </Text>
                          </HStack>
                        </Td>

                        {/* 6. Holati */}
                        <Td borderColor="border">
                          {car.is_active ? (
                            <HStack
                              spacing={1.5}
                              px={2.5}
                              py={1}
                              borderRadius="full"
                              bg="green.50"
                              color="green.700"
                              border="1px solid"
                              borderColor="green.200"
                              display="inline-flex"
                            >
                              <Box
                                w="6px"
                                h="6px"
                                borderRadius="full"
                                bg="green.500"
                              />
                              <Text fontSize="xs" fontWeight="600">
                                Faol
                              </Text>
                            </HStack>
                          ) : (
                            <HStack
                              spacing={1.5}
                              px={2.5}
                              py={1}
                              borderRadius="full"
                              bg="red.50"
                              color="red.700"
                              border="1px solid"
                              borderColor="red.200"
                              display="inline-flex"
                            >
                              <Box
                                w="6px"
                                h="6px"
                                borderRadius="full"
                                bg="red.500"
                              />
                              <Text fontSize="xs" fontWeight="600">
                                Nofaol
                              </Text>
                            </HStack>
                          )}
                        </Td>

                        {/* 7. Amallar */}
                        <Td borderColor="border" pr={6}>
                          <Flex justify="center" align="center" gap={2}>
                            <Tooltip
                              label="Yoqilg'i normasini belgilash"
                              hasArrow
                            >
                              <Button
                                size="xs"
                                variant="outline"
                                borderColor={`${ACCENT}40`}
                                color={ACCENT}
                                _hover={{
                                  bg: `${ACCENT}15`,
                                  borderColor: ACCENT,
                                }}
                                fontSize="11px"
                                fontWeight="600"
                                borderRadius="lg"
                                px={3}
                                h="28px"
                                onClick={() => handleOpenNormModal(car)}
                              >
                                Norma
                              </Button>
                            </Tooltip>

                            <Tooltip label="Tahrirlash" hasArrow>
                              <IconButton
                                icon={<Pencil size={14} />}
                                size="xs"
                                w="28px"
                                h="28px"
                                variant="ghost"
                                color="textSecondary"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="transparent"
                                _hover={{
                                  bg: "blackAlpha.100",
                                  color: "text",
                                  borderColor: "border",
                                }}
                                aria-label="Tahrirlash"
                                onClick={() => handleOpenEdit(car)}
                              />
                            </Tooltip>

                            <Tooltip label="O'chirish" hasArrow>
                              <IconButton
                                icon={<Trash2 size={14} />}
                                size="xs"
                                w="28px"
                                h="28px"
                                variant="ghost"
                                color="red.500"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="transparent"
                                _hover={{
                                  bg: "red.50",
                                  borderColor: "red.200",
                                }}
                                aria-label="O'chirish"
                                onClick={() => handleOpenDelete(car)}
                              />
                            </Tooltip>
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </Box>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          borderRadius="2xl"
          boxShadow="2xl"
          bg="surface"
          overflow="hidden"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor="border"
            fontSize="md"
            fontWeight="700"
            color="text"
            py={4}
            px={6}
          >
            {selectedCarId
              ? "Avtomobil ma'lumotlarini tahrirlash"
              : "Yangi avtomobil qo'shish"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" borderRadius="lg" />

          <ModalBody bg="bg" p={6}>
            <VStack spacing={4} as="form" id="car-form" onSubmit={handleSubmit}>
              {/* Avtomobil Nomi */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Avtomobil nomi
                </FormLabel>
                <Input
                  name="name"
                  placeholder="Masalan: BYD Song Plus"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl isRequired>
                <Flex align="center" justify="space-between" mb={1.5}>
                  <FormLabel
                    fontSize="xs"
                    fontWeight="600"
                    color="textSecondary"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    mb={0}
                  >
                    Davlat raqami
                  </FormLabel>

                  {/* ⚡ ELEKTROMOBIL TOGGLE SWITCH */}
                  <HStack spacing={1.5}>
                    <Zap
                      size={13}
                      color={formData.is_electric ? "#10B981" : "gray"}
                    />
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color={
                        formData.is_electric ? "green.500" : "textSecondary"
                      }
                    >
                      Elektromobil
                    </Text>
                    <Switch
                      size="sm"
                      colorScheme="green"
                      name="is_electric"
                      isChecked={formData.is_electric}
                      onChange={handleChange}
                    />
                  </HStack>
                </Flex>

                {/* Live Preview Davlat Raqami Input */}
                <Flex
                  align="center"
                  bg="white"
                  color="black"
                  border="1.5px solid #000"
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="0 2px 6px rgba(0,0,0,0.08)"
                  h="42px"
                  maxW="270px"
                  userSelect="none"
                  _focusWithin={{
                    borderColor: ACCENT,
                    boxShadow: `0 0 0 3px ${ACCENT}26`,
                  }}
                  transition="all 0.2s ease"
                >
                  {/* 1. Viloyat kodi */}
                  <Center
                    bg={formData.is_electric ? "#70C837" : "white"}
                    px={2.5}
                    h="100%"
                    transition="background 0.2s"
                  >
                    <Text
                      fontWeight="800"
                      fontSize="sm"
                      lineHeight="1"
                      fontFamily="monospace"
                      color={
                        !formData.plate_number ||
                        formData.plate_number.replace(/\s+/g, "").length < 1
                          ? "gray.400"
                          : "black"
                      }
                    >
                      {(() => {
                        const clean = (formData.plate_number || "")
                          .replace(/\s+/g, "")
                          .toUpperCase();
                        if (clean.length === 0) return "01";
                        if (clean.length === 1) return clean;
                        return clean.slice(0, 2);
                      })()}
                    </Text>
                  </Center>

                  {/* Tik chiziq */}
                  <Box w="1.5px" bg="#000" alignSelf="stretch" />

                  {/* 2. Asosiy Input */}
                  <Input
                    name="plate_number"
                    placeholder="020 DAV yoki A 777 AA"
                    variant="unstyled"
                    px={2.5}
                    fontWeight="800"
                    fontSize="sm"
                    fontFamily="monospace"
                    letterSpacing="1px"
                    textTransform="uppercase"
                    color="black"
                    _placeholder={{
                      color: "gray.300",
                      fontWeight: "400",
                      fontSize: "xs",
                    }}
                    value={(() => {
                      const clean = (formData.plate_number || "")
                        .replace(/\s+/g, "")
                        .toUpperCase();
                      return clean.length > 2 ? clean.slice(2) : "";
                    })()}
                    onChange={(e) => {
                      const inputVal = e.target.value
                        .replace(/\s+/g, "")
                        .toUpperCase();
                      const currentFull = (formData.plate_number || "")
                        .replace(/\s+/g, "")
                        .toUpperCase();

                      let updatedValue = "";

                      if (currentFull.length < 2) {
                        // Birinchi 2 ta belgi viloyat kodiga ketadi
                        updatedValue = (currentFull + inputVal).slice(0, 2);
                      } else {
                        // Dastlabki 2 ta viloyat kodi saqlanib, qolgan qismi kiritiladi
                        const region = currentFull.slice(0, 2);
                        updatedValue = region + inputVal;
                      }

                      handleChange({
                        target: {
                          name: "plate_number",
                          value: updatedValue,
                        },
                      });
                    }}
                  />

                  {/* 3. Bayroqcha va UZ */}
                  <VStack
                    spacing={0}
                    align="center"
                    pl={1}
                    pr={2.5}
                    justify="center"
                  >
                    <Text fontSize="11px" lineHeight="1">
                      🇺🇿
                    </Text>
                    <Text
                      fontSize="7.5px"
                      fontWeight="900"
                      color="#0033A0"
                      lineHeight="1"
                      mt="1px"
                    >
                      UZ
                    </Text>
                  </VStack>
                </Flex>
              </FormControl>

              {/* Mas'ul xodim */}
              <FormControl>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Mas'ul xodim
                </FormLabel>
                <Select
                  name="responsible_employee_id"
                  placeholder="Mas'ul xodimni tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={formData.responsible_employee_id}
                  onChange={handleChange}
                >
                  {responsibles.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.login || "Ismsiz xodim"}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Haydovchi */}
              <FormControl>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Haydovchi
                </FormLabel>
                <Select
                  name="driver_id"
                  placeholder="Haydovchini tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={formData.driver_id}
                  onChange={handleChange}
                >
                  {drivers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.login || "Ismsiz xodim"}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Speedometer */}
              <FormControl>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Speedometer (km)
                </FormLabel>
                <Input
                  type="number"
                  name="speedometer"
                  placeholder="0"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={formData.speedometer}
                  onChange={handleChange}
                />
              </FormControl>

              {/* Avtomobil holati */}
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                pt={2}
                px={1}
              >
                <FormLabel fontSize="sm" fontWeight="500" color="text" mb={0}>
                  Avtomobil holati (Faol)
                </FormLabel>
                <Switch
                  name="is_active"
                  colorScheme="blue"
                  isChecked={formData.is_active}
                  onChange={handleChange}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          {/* Modal Footer */}
          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surface"
            py={3.5}
            px={6}
          >
            <Button
              variant="ghost"
              color="textSecondary"
              _hover={{ bg: "blackAlpha.50", color: "text" }}
              mr={3}
              onClick={onFormClose}
              size="sm"
              borderRadius="xl"
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB", transform: "translateY(-1px)" }}
              _active={{ bg: "#1D4ED8", transform: "translateY(0)" }}
              type="submit"
              form="car-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
              borderRadius="xl"
              boxShadow="sm"
              transition="all 0.15s ease"
            >
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 🟢 NORMA O'RNATISH MODAL */}
      <Modal isOpen={isNormOpen} onClose={onNormClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          borderRadius="2xl"
          boxShadow="2xl"
          bg="surface"
          overflow="hidden"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor="border"
            py={4}
            px={6}
          >
            <HStack spacing={2.5}>
              <Center
                w="32px"
                h="32px"
                borderRadius="lg"
                bg={`${ACCENT}15`}
                color={ACCENT}
              >
                <Fuel size={18} />
              </Center>
              <Text fontSize="md" fontWeight="700" color="text">
                Yoqilg'i normasini belgilash
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton
            mt={1.5}
            mr={1}
            color="textSecondary"
            borderRadius="lg"
          />

          <ModalBody bg="bg" p={6}>
            <VStack
              spacing={4}
              as="form"
              id="norm-form"
              onSubmit={handleNormSubmit}
            >
              <Box
                w="full"
                p={3.5}
                borderRadius="xl"
                bg="surface"
                border="1px solid"
                borderColor="border"
                boxShadow="xs"
              >
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb={1}
                >
                  Tanlangan avtomobil
                </Text>
                <Flex align="center" justify="space-between">
                  <Text fontWeight="600" color="text" fontSize="sm">
                    {selectedCar?.name || "Avtomobil tanlanmagan"}
                  </Text>

                  {selectedCar?.plate_number && (
                    <Badge
                      bg="white"
                      color="black"
                      border="1px solid #000"
                      borderRadius="base"
                      px={1.5}
                      py={0.5}
                      fontFamily="monospace"
                      fontSize="xs"
                      fontWeight="800"
                      letterSpacing="0.5px"
                    >
                      {(() => {
                        const { region, main } = formatPlateNumber(
                          selectedCar.plate_number
                        );
                        return `${region} ${main}`.trim();
                      })()}
                    </Badge>
                  )}
                </Flex>
              </Box>

              <FormControl isRequired>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Yoqilg'i turi
                </FormLabel>
                <Select
                  placeholder="Yonilg'ini tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={normFormData.fuel_id}
                  onChange={(e) =>
                    setNormFormData({
                      ...normFormData,
                      fuel_id: e.target.value,
                    })
                  }
                >
                  {fuels.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="xs"
                  fontWeight="600"
                  color="textSecondary"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  100 km uchun norma (Litr / Kub / KW)
                </FormLabel>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Masalan: 8.5"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  borderRadius="xl"
                  size="md"
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={normFormData.norm_per_100km}
                  onChange={(e) =>
                    setNormFormData({
                      ...normFormData,
                      norm_per_100km: e.target.value,
                    })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surface"
            py={3.5}
            px={6}
          >
            <Button
              variant="ghost"
              color="textSecondary"
              _hover={{ bg: "blackAlpha.50", color: "text" }}
              mr={3}
              onClick={onNormClose}
              size="sm"
              borderRadius="xl"
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB", transform: "translateY(-1px)" }}
              _active={{ bg: "#1D4ED8", transform: "translateY(0)" }}
              type="submit"
              form="norm-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
              borderRadius="xl"
              boxShadow="sm"
              transition="all 0.15s ease"
            >
              Normani saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            fontSize="lg"
            color="red.500"
            borderTopRadius="xl"
          >
            O'chirishni tasdiqlang
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={4}>
            <Text color="text">
              Siz rostdan ham <b>{carToDelete?.name}</b> avtomobilini
              o'chirmoqchimisiz?
            </Text>
            <Text mt={2} fontSize="sm" color="textSecondary">
              Ushbu amalni ortga qaytarib bo'lmaydi.
            </Text>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surfBlur"
            borderBottomRadius="xl"
          >
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onDeleteClose}
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              size="sm"
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={handleConfirmDelete}
              isLoading={isSubmitting}
            >
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}