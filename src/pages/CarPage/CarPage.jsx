import { useState, useEffect, useRef, useMemo } from "react";
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
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
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
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { apiCars } from "../../Services/api/Cars";
import { apiEmployees } from "../../Services/api/Users";
import { apiFuel } from "../../Services/api/Fuels";
import toast from "react-hot-toast";

const ACCENT = "#3B82F6";

const VALID_REGION_CODES = [
  "01",
  "10",
  "20",
  "25",
  "30",
  "35",
  "40",
  "50",
  "60",
  "70",
  "75",
  "80",
  "85",
  "90",
  "95",
];

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
  is_electric: false,
  is_active: true,
};

const initialNormState = {
  car_id: "",
  fuel_id: "",
  norm_per_100km: "",
};

const ITEMS_PER_PAGE = 10;

export default function CarPage() {
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [fuels, setFuels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const hasLoadedOnceRef = useRef(false);
  const fetchIdRef = useRef(0);
  const didMountRef = useRef(false);
  const prevShowDeletedRef = useRef(showDeleted);

  const [plateRegion, setPlateRegion] = useState("");
  const [plateMain, setPlateMain] = useState("");
  const regionInputRef = useRef(null);
  const mainInputRef = useRef(null);
  const plateRegionRef = useRef("");

  const [normFormData, setNormFormData] = useState(initialNormState);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carToDelete, setCarToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

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

  const extractPaginationMeta = (res) => {
    const payload = res?.data;
    const total =
      payload?.total ??
      payload?.count ??
      payload?.totalRecords ??
      payload?.data?.total ??
      payload?.data?.count ??
      0;

    const pages =
      payload?.totalPages ??
      payload?.pages ??
      payload?.data?.totalPages ??
      payload?.data?.pages ??
      Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

    return { total: Number(total) || 0, pages: Number(pages) || 1 };
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

  const fetchCars = async (targetPage = currentPage) => {
    const fetchId = ++fetchIdRef.current;

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const res = await apiCars.All(
        targetPage,
        ITEMS_PER_PAGE,
        search,
        undefined,
        showDeleted,
      );
      if (fetchIdRef.current !== fetchId) return;

      const rawData = extractRecords(res);
      const { total, pages } = extractPaginationMeta(res);
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
          is_electric: isElectric,
          is_active:
            car.is_active !== undefined ? Boolean(car.is_active) : true,
          car_fuel_norm: Array.isArray(car.car_fuel_norm)
            ? car.car_fuel_norm
            : [],
        };
      });

      setCars(mappedCars);
      setTotalItems(total || mappedCars.length);
      setServerTotalPages(pages);

      if (mappedCars.length === 0 && targetPage > 1 && targetPage > pages) {
        setCurrentPage(pages);
      }
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;
      console.error("Avtomobillarni yuklashda xatolik:", error);
    } finally {
      if (fetchIdRef.current === fetchId) {
        setLoading(false);
        setIsFetching(false);
        hasLoadedOnceRef.current = true;
      }
    }
  };

  useEffect(() => {
    fetchEmployeesByRole();
    fetchFuels();
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevShowDeletedRef.current = showDeleted;
      fetchCars(currentPage);
      return;
    }

    const showDeletedChanged = prevShowDeletedRef.current !== showDeleted;
    prevShowDeletedRef.current = showDeleted;

    if (showDeletedChanged) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchCars(1);
      }
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchCars(currentPage);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [search, showDeleted, currentPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleShowDeletedChange = (val) => {
    setShowDeleted(val);
    setCurrentPage(1);
  };

  const totalPages = useMemo(
    () => Math.max(1, serverTotalPages),
    [serverTotalPages],
  );
  const safeCurrentPage = useMemo(
    () => Math.min(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const paginatedCars = cars;

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

  const handleRestore = async (id) => {
    try {
      await apiCars.Restore(id);
      fetchCars(currentPage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    const fullPlate = `${plateRegion}${plateMain}`.trim();
    setFormData((prev) => ({ ...prev, plate_number: fullPlate }));
  }, [plateRegion, plateMain]);

  useEffect(() => {
    plateRegionRef.current = plateRegion;
  }, [plateRegion]);

  const handleOpenCreate = () => {
    setSelectedCarId(null);
    setFormData(initialFormState);
    setPlateRegion("");
    setPlateMain("");
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

    const clean = (car.plate_number || "").replace(/\s+/g, "").toUpperCase();
    const reg = clean.slice(0, 2);
    const main = clean.slice(2);
    setPlateRegion(reg);
    setPlateMain(main);

    onFormOpen();
  };

  const handleRegionChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    setPlateRegion(val);
    plateRegionRef.current = val;

    if (val.length === 2) {
      mainInputRef.current?.focus();
    }
  };

  const handleMainChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setPlateMain(val);
  };

  const handleMainKeyDown = (e) => {
    if (e.key === "Backspace" && plateMain === "") {
      regionInputRef.current?.focus();
    }
  };

  const handleMainFocus = () => {
    if (plateRegionRef.current.length < 2) {
      regionInputRef.current?.focus();
    }
  };

  const isRegionInvalid =
    plateRegion.length === 2 && !VALID_REGION_CODES.includes(plateRegion);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.plate_number.trim() ||
      isRegionInvalid ||
      plateRegion.length < 2
    ) {
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
        setElectricStatus(selectedCarId, formData.is_electric);
      } else {
        const createRes = await apiCars.Create(payload);
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
      fetchCars(currentPage);
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
      current_balance: "",
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
      current_balance: Number(normFormData.current_balance),
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

      const nextPage =
        cars.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchCars(currentPage);
      }
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPlateNumber = (plate) => {
    if (!plate) return { region: "20", main: "" };
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
              {showDeleted ? "O'chirilgan avtomobillar" : "Avtomobillar"}
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

        {/* SEARCH + TOGGLE + COUNT ROW */}
        <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={5}>
          <HStack spacing={3} wrap="wrap" flex="1" maxW="600px">
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
                onChange={handleSearchChange}
              />
            </InputGroup>

            {/* TOGGLE SWITCH: Faol / O'chirilgan */}
            <ButtonGroup
              isAttached
              variant="outline"
              bg="surface"
              p="3px"
              borderRadius="xl"
              border="1px solid"
              borderColor="border"
            >
              <Button
                size="sm"
                borderRadius="lg"
                border="none"
                bg={!showDeleted ? ACCENT : "transparent"}
                color={!showDeleted ? "white" : "textSecondary"}
                _hover={{
                  bg: !showDeleted ? ACCENT : "blackAlpha.50",
                  color: !showDeleted ? "white" : "text",
                }}
                fontWeight="600"
                fontSize="xs"
                px={4}
                onClick={() => handleShowDeletedChange(false)}
              >
                Faol
              </Button>
              <Button
                size="sm"
                borderRadius="lg"
                border="none"
                bg={showDeleted ? "red.500" : "transparent"}
                color={showDeleted ? "white" : "textSecondary"}
                _hover={{
                  bg: showDeleted ? "red.600" : "blackAlpha.50",
                  color: showDeleted ? "white" : "text",
                }}
                fontWeight="600"
                fontSize="xs"
                px={4}
                onClick={() => handleShowDeletedChange(true)}
              >
                O'chirilgan
              </Button>
            </ButtonGroup>
          </HStack>

          {/* COUNT BADGE + BACKGROUND YANGILANISH INDIKATORI */}
          <HStack spacing={3}>
            {isFetching && (
              <HStack spacing={1.5} color="textSecondary">
                <Spinner size="xs" color={ACCENT} thickness="2px" />
                <Text fontSize="xs">Yangilanmoqda...</Text>
              </HStack>
            )}
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
              {showDeleted ? "O'chirilgan:" : "Jami:"} {totalItems} ta
            </Badge>
          </HStack>
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
            ) : cars.length === 0 && !isFetching ? (
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
              <Box
                w="100%"
                overflow="hidden"
                opacity={isFetching ? 0.55 : 1}
                pointerEvents={isFetching ? "none" : "auto"}
                transition="opacity 0.15s ease"
              >
                <Table variant="simple" size="sm" style={{ tableLayout: "fixed", width: "100%" }}>
                  <Thead>
                    <Tr bg="surfBlur">
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="20%"
                      >
                        Avtomobil nomi
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="15%"
                      >
                        Davlat raqami
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="15%"
                      >
                        Haydovchi
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="15%"
                      >
                        Mas'ul xodim
                      </Th>
                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="12%"
                      >
                        Speedometer
                      </Th>

                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="13%"
                      >
                        Yoqilg'i qoldig'i
                      </Th>

                      <Th
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={3}
                        whiteSpace="nowrap"
                        w="8%"
                      >
                        Holati
                      </Th>

                      <Th
                        textAlign="center"
                        color="text"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={3}
                        px={2}
                        whiteSpace="nowrap"
                        w="50px"
                      >
                        ⋮
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedCars.map((car) => (
                      <Tr
                        key={car.id}
                        transition="all 0.2s ease"
                        _hover={{
                          bg: "blackAlpha.50",
                        }}
                      >
                        {/* 1. Avtomobil Nomi */}
                        <Td borderColor="border" px={3} py={2.5}>
                          <HStack spacing={2.5} overflow="hidden">
                            <Center
                              w="32px"
                              h="32px"
                              minW="32px"
                              borderRadius="lg"
                              bgGradient={`linear(to-br, ${car.is_electric ? "#10B98120" : ACCENT + "20"}, ${car.is_electric ? "#10B98108" : ACCENT + "08"})`}
                              border="1px solid"
                              borderColor={
                                car.is_electric ? "#10B98130" : `${ACCENT}30`
                              }
                              color={car.is_electric ? "green.500" : ACCENT}
                            >
                              <CarIcon size={16} strokeWidth={2.2} />
                            </Center>
                            <VStack align="start" spacing={0} overflow="hidden">
                              <Text
                                fontWeight="600"
                                color="text"
                                fontSize="xs"
                                noOfLines={2}
                                wordBreak="break-word"
                                lineHeight="1.2"
                              >
                                {car.name}
                              </Text>
                              <Text fontSize="10px" color="textSecondary" lineHeight="1.2">
                                Transport
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>

                        {/* 2. Davlat raqami */}
                        <Td borderColor="border" px={3} py={2.5}>
                          <Flex
                            align="center"
                            bg="white"
                            color="black"
                            border="1px solid #000"
                            borderRadius="md"
                            overflow="hidden"
                            h="26px"
                            w="fit-content"
                            userSelect="none"
                          >
                            <Center
                              bg={car.is_electric ? "#70C837" : "white"}
                              px={1.5}
                              h="100%"
                            >
                              <Text
                                fontWeight="800"
                                fontSize="11px"
                                lineHeight="1"
                                fontFamily="monospace"
                                color="black"
                              >
                                {formatPlateNumber(car.plate_number).region}
                              </Text>
                            </Center>

                            <Box w="1px" bg="#000" alignSelf="stretch" />

                            <Center px={1.5} h="100%">
                              <Text
                                fontWeight="800"
                                fontSize="11px"
                                fontFamily="monospace"
                                letterSpacing="0.5px"
                                textTransform="uppercase"
                                color="black"
                                whiteSpace="nowrap"
                              >
                                {formatPlateNumber(car.plate_number).main}
                              </Text>
                            </Center>

                            <VStack
                              spacing={0}
                              align="center"
                              px={1}
                              justify="center"
                            >
                              <Text fontSize="8px" lineHeight="1">
                                🇺🇿
                              </Text>
                              <Text
                                fontSize="5.5px"
                                fontWeight="900"
                                color="#0033A0"
                                lineHeight="1"
                              >
                                UZ
                              </Text>
                            </VStack>
                          </Flex>
                        </Td>

                        {/* 3. Haydovchi */}
                        <Td borderColor="border" px={3} py={2.5}>
                          <Text 
                            color="text" 
                            fontSize="xs" 
                            fontWeight="500" 
                            noOfLines={2} 
                            wordBreak="break-word"
                            lineHeight="1.2"
                          >
                            {car.driver_name}
                          </Text>
                        </Td>

                        {/* 4. Mas'ul Xodim */}
                        <Td borderColor="border" px={3} py={2.5}>
                          <Text 
                            color="textSecondary" 
                            fontSize="xs" 
                            noOfLines={2} 
                            wordBreak="break-word"
                            lineHeight="1.2"
                          >
                            {car.responsible_name}
                          </Text>
                        </Td>

                        {/* 5. Speedometer */}
                        <Td borderColor="border" px={3} py={2.5}>
                          <HStack
                            spacing={1.5}
                            bg="blackAlpha.50"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            display="inline-flex"
                            border="1px solid"
                            borderColor="border"
                          >
                            <Gauge
                              size={12}
                              color="var(--chakra-colors-textSecondary)"
                            />
                            <Text color="text" fontSize="11px" fontWeight="600" whiteSpace="nowrap">
                              {car.speedometer
                                ? car.speedometer.toLocaleString("uz-UZ")
                                : 0}{" "}
                              km
                            </Text>
                          </HStack>
                        </Td>

                        {/* 6. YOQILG'I QOLDIG'I */}
                        <Td borderColor="border" px={3} py={2.5}>
                          {car.car_fuel_norm && car.car_fuel_norm.length > 0 ? (
                            <VStack align="start" spacing={1} maxW="100%">
                              {car.car_fuel_norm
                                .slice(0, 2)
                                .map((norm, idx) => {
                                  const fuelName =
                                    norm?.fuel?.name || "Yoqilg'i";
                                  const balance = Number(
                                    norm?.norm_per_100km || 0,
                                  ).toFixed(1);

                                  return (
                                    <HStack
                                      key={idx}
                                      spacing={1}
                                      px={1.5}
                                      py={0.5}
                                      borderRadius="md"
                                      bg="blue.50"
                                      color="blue.700"
                                      border="1px solid"
                                      borderColor="blue.100"
                                      fontSize="10px"
                                      fontWeight="600"
                                      w="fit-content"
                                    >
                                      <Fuel size={10} />
                                      <Text lineHeight="1" whiteSpace="nowrap">
                                        {fuelName}: <b>{balance}</b>
                                      </Text>
                                    </HStack>
                                  );
                                })}
                            </VStack>
                          ) : (
                            <Text
                              fontSize="11px"
                              color="textSecondary"
                              fontStyle="italic"
                              whiteSpace="nowrap"
                            >
                              Mavjud emas
                            </Text>
                          )}
                        </Td>

                        {/* 7. Holati */}
                        <Td borderColor="border" px={3} py={2.5}>
                          {car.is_active ? (
                            <HStack
                              spacing={1}
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg="green.50"
                              color="green.700"
                              border="1px solid"
                              borderColor="green.200"
                              display="inline-flex"
                            >
                              <Box
                                w="5px"
                                h="5px"
                                borderRadius="full"
                                bg="green.500"
                              />
                              <Text fontSize="10px" fontWeight="600" whiteSpace="nowrap">
                                Faol
                              </Text>
                            </HStack>
                          ) : (
                            <HStack
                              spacing={1}
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg="red.50"
                              color="red.700"
                              border="1px solid"
                              borderColor="red.200"
                              display="inline-flex"
                            >
                              <Box
                                w="5px"
                                h="5px"
                                borderRadius="full"
                                bg="red.500"
                              />
                              <Text fontSize="10px" fontWeight="600" whiteSpace="nowrap">
                                Nofaol
                              </Text>
                            </HStack>
                          )}
                        </Td>

                        {/* 8. AMALLAR (KEBAB MENU) */}
                        <Td borderColor="border" px={2} py={2.5} textAlign="center">
                          {showDeleted ? (
                            <Tooltip label="Tiklash" hasArrow>
                              <IconButton
                                icon={<RotateCcw size={14} />}
                                size="xs"
                                w="26px"
                                h="26px"
                                minW="26px"
                                colorScheme="green"
                                variant="light"
                                bg="green.50"
                                color="green.600"
                                _hover={{ bg: "green.100" }}
                                borderRadius="md"
                                aria-label="Tiklash"
                                onClick={() => handleRestore(car.id)}
                              />
                            </Tooltip>
                          ) : (
                            <Menu isLazy placement="bottom-end">
                              <MenuButton
                                as={IconButton}
                                icon={<MoreVertical size={15} />}
                                size="xs"
                                w="26px"
                                h="26px"
                                minW="26px"
                                variant="ghost"
                                color="textSecondary"
                                borderRadius="md"
                                border="1px solid"
                                borderColor="border"
                                _hover={{
                                  bg: "blackAlpha.100",
                                  color: "text",
                                }}
                                aria-label="Amallar"
                              />
                              <MenuList
                                bg="surface"
                                borderColor="border"
                                boxShadow="lg"
                                p={1}
                                minW="130px"
                              >
                                <MenuItem
                                  icon={<Fuel size={14} color={ACCENT} />}
                                  fontSize="xs"
                                  fontWeight="500"
                                  color="text"

                                  _hover={{ bg: "blackAlpha.50" }}
                                  onClick={() => handleOpenNormModal(car)}
                                >
                                  Norma
                                </MenuItem>
                                <MenuItem
                                  icon={<Pencil size={14} />}
                                  fontSize="xs"
                                  fontWeight="500"
                                  color="text"
                           
                                  _hover={{ bg: "blackAlpha.50" }}
                                  onClick={() => handleOpenEdit(car)}
                                >
                                  Tahrirlash
                                </MenuItem>
                                <MenuItem
                                  icon={<Trash2 size={14} color="var(--chakra-colors-red-500)" />}
                                  fontSize="xs"
                                  fontWeight="500"
                                  color="red.500"

                                  _hover={{ bg: "red.50" }}
                                  onClick={() => handleOpenDelete(car)}
                                >
                                  O'chirish
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}

            {/* PAGINATION CONTROLS */}
            {!loading && totalItems > 0 && (
              <Flex
                justify="space-between"
                align="center"
                px={6}
                py={4}
                borderTop="1px solid"
                borderColor="border"
                flexWrap="wrap"
                gap={3}
              >
                <Text fontSize="xs" color="textSecondary">
                  {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems)} /{" "}
                  {totalItems} ta ko'rsatilmoqda
                </Text>

                <HStack spacing={1.5}>
                  <IconButton
                    icon={<ChevronLeft size={16} />}
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    color="textSecondary"
                    borderRadius="lg"
                    aria-label="Oldingi sahifa"
                    isDisabled={safeCurrentPage === 1}
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    _hover={{ bg: "blackAlpha.50", color: "text" }}
                  />

                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      minW="36px"
                      borderRadius="lg"
                      fontWeight="600"
                      fontSize="xs"
                      bg={page === safeCurrentPage ? ACCENT : "transparent"}
                      color={
                        page === safeCurrentPage ? "white" : "textSecondary"
                      }
                      border="1px solid"
                      borderColor={page === safeCurrentPage ? ACCENT : "border"}
                      _hover={{
                        bg: page === safeCurrentPage ? ACCENT : "blackAlpha.50",
                        color: page === safeCurrentPage ? "white" : "text",
                      }}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <IconButton
                    icon={<ChevronRight size={16} />}
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    color="textSecondary"
                    borderRadius="lg"
                    aria-label="Keyingi sahifa"
                    isDisabled={safeCurrentPage === totalPages}
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    _hover={{ bg: "blackAlpha.50", color: "text" }}
                  />
                </HStack>
              </Flex>
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
                  placeholder="Masalan: Lacetti"
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

              {/* Davlat raqami */}
              <FormControl isInvalid={isRegionInvalid}>
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

                <Flex
                  align="center"
                  bg="white"
                  color="black"
                  border="2px solid"
                  borderColor={isRegionInvalid ? "red.500" : "#000"}
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="0 2px 6px rgba(0,0,0,0.08)"
                  h="44px"
                  maxW="290px"
                  userSelect="none"
                  _focusWithin={{
                    borderColor: isRegionInvalid ? "red.500" : ACCENT,
                    boxShadow: isRegionInvalid
                      ? "0 0 0 3px rgba(239, 68, 68, 0.2)"
                      : `0 0 0 3px ${ACCENT}26`,
                  }}
                  transition="all 0.2s ease"
                >
                  <Center
                    bg={formData.is_electric ? "#70C837" : "white"}
                    w="48px"
                    h="100%"
                    transition="background 0.2s"
                  >
                    <Input
                      ref={regionInputRef}
                      placeholder="01"
                      variant="unstyled"
                      textAlign="center"
                      fontWeight="800"
                      fontSize="sm"
                      fontFamily="monospace"
                      color="black"
                      maxLength={2}
                      value={plateRegion}
                      onChange={handleRegionChange}
                      _placeholder={{ color: "gray.300", fontWeight: "400" }}
                    />
                  </Center>

                  <Box w="1.5px" bg="#000" alignSelf="stretch" />

                  <Input
                    ref={mainInputRef}
                    placeholder="A 123 AA"
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
                    value={plateMain}
                    onChange={handleMainChange}
                    onKeyDown={handleMainKeyDown}
                    onFocus={handleMainFocus}
                  />

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

                {isRegionInvalid && (
                  <Text color="red.500" fontSize="xs" mt={1.5} fontWeight="500">
                    Bunday viloyat kodi mavjud emas
                  </Text>
                )}
              </FormControl>

              {/* Mas'ul xodim */}
              <FormControl isRequired>
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
              <FormControl isRequired>
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
              <FormControl isRequired>
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
              isDisabled={isRegionInvalid || plateRegion.length < 2}
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

      {/* NORMA O'RNATISH MODAL */}
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
                          selectedCar.plate_number,
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
              <FormControl>
                <FormLabel>Dastlabki yoqilgisi</FormLabel>
                <Input
                  type="number"
                  placeholder="Masalan: 10 Litr"
                  bg={"surface"}
                  color={"text"}
                  borderColor={"border"}
                  borderRadius={"xl"}
                  size={"md"}
                  focusBorderColor={ACCENT}
                  _hover={{ borderColor: ACCENT }}
                  value={normFormData.current_balance}
                  onChange={(e) => {
                    setNormFormData({
                      ...normFormData,
                      current_balance: e.target.value,
                    });
                  }}
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
