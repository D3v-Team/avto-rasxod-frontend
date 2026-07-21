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
  useToast,
  Tooltip,
  Spinner,
  Center,
  VStack,
  HStack,
  Switch,
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Car as CarIcon, Gauge, Fuel } from "lucide-react";
import { apiCars } from "../../Services/api/Cars";
import { apiEmployees } from "../../Services/api/Users";
import { apiFuel } from "../../Services/api/Fuels";

const ACCENT = "#3B82F6";

const initialFormState = {
  name: "",
  plate_number: "",
  responsible_employee_id: "",
  driver_id: "",
  speedometer: 0,
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
  const [fuels, setFuels] = useState([]); // Yonilg'i turlari

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [normFormData, setNormFormData] = useState(initialNormState);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carToDelete, setCarToDelete] = useState(null);

  // Modallar disclosure
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

  const toast = useToast();

  // 1. Xodimlarni role bo'yicha yuklash
  const fetchEmployeesByRole = async () => {
    try {
      const [driversRes, responsiblesRes] = await Promise.all([
        apiEmployees.Filter("driver", "", 1, 100),
        apiEmployees.Filter("responsible", "", 1, 100),
      ]);

      const rawDrivers = driversRes.data?.data || driversRes.data || [];
      const rawResponsibles = responsiblesRes.data?.data || responsiblesRes.data || [];

      setDrivers(rawDrivers);
      setResponsibles(rawResponsibles);
    } catch (error) {
      console.error("Xodimlarni yuklashda xatolik:", error);
    }
  };

  // 2. Yonilg'i turlarini yuklash (Norma modal uchun)
  const fetchFuels = async () => {
    try {
      const res = await apiFuel.All(1, 100);
      const rawFuels = res.data?.data || res.data || [];
      setFuels(rawFuels);
    } catch (error) {
      console.error("Yonilg'i turlarini yuklashda xatolik:", error);
    }
  };

  // 3. Avtomobillar ro'yxatini yuklash
  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await apiCars.All(1, 100, search);
      const rawData = res.data?.data || res.data || [];

      const mappedCars = rawData.map((car) => {
        let driverName = "Biriktirilmagan";
        if (car.driver && typeof car.driver === "object") {
          driverName = car.driver.full_name || car.driver.login || "Ismsiz xodim";
        } else if (car.driver_info && typeof car.driver_info === "object") {
          driverName = car.driver_info.full_name || "Ismsiz xodim";
        } else if (typeof car.driver === "string") {
          driverName = car.driver;
        }

        let responsibleName = "Biriktirilmagan";
        if (car.responsible_employee && typeof car.responsible_employee === "object") {
          responsibleName = car.responsible_employee.full_name || car.responsible_employee.login || "Ismsiz xodim";
        } else if (typeof car.responsible_employee === "string") {
          responsibleName = car.responsible_employee;
        }

        return {
          id: car.id,
          name: car.name || car.car_name || "Nomsiz transport",
          plate_number: car.plate_number || car.plate || car.state_number || "",
          driver_name: driverName,
          driver_id: car.driver && typeof car.driver === "object" ? car.driver.id : car.driver_id || "",
          responsible_name: responsibleName,
          responsible_employee_id:
            car.responsible_employee && typeof car.responsible_employee === "object"
              ? car.responsible_employee.id
              : car.responsible_employee_id || "",
          speedometer: Number(car.speedometer || 0),
          is_active: car.is_active !== undefined ? Boolean(car.is_active) : true,
        };
      });

      setCars(mappedCars);
    } catch (error) {
      console.error("Avtomobillarni yuklashda xatolik:", error);
      toast({
        title: "Ma'lumotlarni yuklab bo'lmadi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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

  // Form handling
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "speedometer"
          ? Number(value)
          : value,
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
      speedometer: car.speedometer || 0,
      is_active: car.is_active ?? true,
    });
    onFormOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.plate_number.trim()) {
      toast({
        title: "Avtomobil nomi va davlat raqamini kiriting",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      plate_number: formData.plate_number,
      responsible_employee_id: formData.responsible_employee_id || null,
      driver_id: formData.driver_id || null,
      speedometer: Number(formData.speedometer) || 0,
      is_active: Boolean(formData.is_active),
    };

    try {
      if (selectedCarId) {
        await apiCars.Update(selectedCarId, payload);
      } else {
        await apiCars.Create(payload);
      }
      onFormClose();
      fetchCars();
    } catch (error) {
      console.error("Saqlashda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 NORMA O'RNATISH MODALINI OCHISH
  const handleOpenNormModal = (car) => {
    setSelectedCar(car);
    setNormFormData({
      car_id: car.id,
      fuel_id: "",
      norm_per_100km: "",
    });
    onNormOpen();
  };

  // 🟢 NORMA NI SAQLASH
  const handleNormSubmit = async (e) => {
    e.preventDefault();

    if (!normFormData.fuel_id || !normFormData.norm_per_100km) {
      toast({
        title: "Yonilg'i turi va normani kiriting",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
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
      onDeleteClose();
      fetchCars();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      bg="bg"
      minH="100vh"
      p={{ base: 4, md: 6 }}
      transition="background 0.2s ease"
    >
      <Box maxW="container.xl" mx="auto">
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
                  <Text color="textSecondary" fontSize="md">
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
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                        py={4}
                        pl={6}
                      >
                        Avtomobil nomi
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Davlat raqami
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Haydovchi
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Mas'ul xodim
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Speedometer
                      </Th>
                      <Th
                        color="textSecondary"
                        fontSize="xs"
                        letterSpacing="0.5px"
                        borderColor="border"
                      >
                        Holati
                      </Th>
                      <Th
                        textAlign="center"
                        color="textSecondary"
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
                        transition="background 0.15s ease"
                        _hover={{ bg: "blackAlpha.50" }}
                      >
                        <Td borderColor="border" pl={6} py={3.5}>
                          <HStack spacing={3}>
                            <Center p={2} borderRadius="lg" bg={`${ACCENT}1A`}>
                              <CarIcon size={18} color={ACCENT} />
                            </Center>
                            <Text fontWeight="600" color="text">
                              {car.name}
                            </Text>
                          </HStack>
                        </Td>

                        <Td borderColor="border">
                          <Badge
                            variant="outline"
                            borderColor="border"
                            color="text"
                            px={2.5}
                            py={0.5}
                            borderRadius="md"
                            fontWeight="600"
                            letterSpacing="0.5px"
                          >
                            {car.plate_number}
                          </Badge>
                        </Td>

                        <Td borderColor="border" color="textSecondary" fontSize="sm">
                          {car.driver_name}
                        </Td>

                        <Td borderColor="border" color="textSecondary" fontSize="sm">
                          {car.responsible_name}
                        </Td>

                        <Td borderColor="border" color="text" fontSize="sm" fontWeight="500">
                          <HStack spacing={1.5}>
                            <Gauge size={14} color="var(--chakra-colors-textSecondary)" />
                            <Text>{car.speedometer.toLocaleString("uz-UZ")} km</Text>
                          </HStack>
                        </Td>

                        <Td borderColor="border">
                          {car.is_active ? (
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              bg="green.50"
                              color="green.600"
                              border="1px solid"
                              borderColor="green.200"
                            >
                              Faol
                            </Badge>
                          ) : (
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              bg="red.50"
                              color="red.600"
                              border="1px solid"
                              borderColor="red.200"
                            >
                              Nofaol
                            </Badge>
                          )}
                        </Td>

                        <Td borderColor="border" pr={6}>
                          <Flex justify="center" align="center" gap={1.5}>
                            {/* 🟢 ENDI ISHLAYDIGAN NORMA O'RNATISH TUGMASI */}
                            <Tooltip label="Yonilg'i normasini o'rnatish">
                              <Button
                                size="xs"
                                variant="outline"
                                borderColor="border"
                                color={ACCENT}
                                _hover={{ bg: `${ACCENT}1A` }}
                                fontSize="11px"
                                borderRadius="md"
                                onClick={() => handleOpenNormModal(car)}
                              >
                                Norma o'rnatish
                              </Button>
                            </Tooltip>

                            <Tooltip label="Tahrirlash">
                              <IconButton
                                icon={<Pencil size={15} />}
                                size="sm"
                                variant="ghost"
                                color="textSecondary"
                                borderRadius="md"
                                _hover={{ bg: "blackAlpha.50", color: "text" }}
                                aria-label="Tahrirlash"
                                onClick={() => handleOpenEdit(car)}
                              />
                            </Tooltip>

                            <Tooltip label="O'chirish">
                              <IconButton
                                icon={<Trash2 size={15} />}
                                size="sm"
                                variant="ghost"
                                color="red.500"
                                borderRadius="md"
                                _hover={{ bg: "red.50" }}
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
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            borderBottom="1px solid"
            borderColor="border"
            fontSize="lg"
            color="text"
            borderTopRadius="xl"
          >
            {selectedCarId
              ? "Avtomobil ma'lumotlarini tahrirlash"
              : "Yangi avtomobil qo'shish"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={6}>
            <VStack spacing={4} as="form" id="car-form" onSubmit={handleSubmit}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Avtomobil nomi
                </FormLabel>
                <Input
                  name="name"
                  placeholder="Masalan: Chevrolet Cobalt"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Davlat raqami
                </FormLabel>
                <Input
                  name="plate_number"
                  placeholder="Masalan: 01 A 777 AA"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={formData.plate_number}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Mas'ul xodim
                </FormLabel>
                <Select
                  name="responsible_employee_id"
                  placeholder="Mas'ul xodimni tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
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

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Haydovchi
                </FormLabel>
                <Select
                  name="driver_id"
                  placeholder="Haydovchini tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
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

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Speedometer (km)
                </FormLabel>
                <Input
                  type="number"
                  name="speedometer"
                  placeholder="0"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={formData.speedometer}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl display="flex" align="center" justify="space-between" pt={2}>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary" mb={0}>
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

          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surfBlur"
            borderBottomRadius="xl"
          >
            <Button
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onFormClose}
              size="sm"
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              type="submit"
              form="car-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
            >
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 🟢 NORMA O'RNATISH MODAL */}
      <Modal isOpen={isNormOpen} onClose={onNormClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl" bg="surface">
          <ModalHeader
            bg="surfBlur"
            borderBottom="1px solid"
            borderColor="border"
            fontSize="lg"
            color="text"
            borderTopRadius="xl"
          >
            <HStack spacing={2}>
              <Fuel size={20} color={ACCENT} />
              <Text fontSize="md">Yoqilg'i normasini belgilash</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />

          <ModalBody bg="bg" py={6}>
            <VStack spacing={4} as="form" id="norm-form" onSubmit={handleNormSubmit}>
              <Box w="full" p={3} borderRadius="lg" bg={`${ACCENT}10`} border="1px solid" borderColor={`${ACCENT}30`}>
                <Text fontSize="xs" color="textSecondary">Tanlangan avtomobil:</Text>
                <Text fontWeight="600" color="text">{selectedCar?.name} ({selectedCar?.plate_number})</Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Yoqilg'i turi
                </FormLabel>
                <Select
                  placeholder="Yonilg'ini tanlang"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={normFormData.fuel_id}
                  onChange={(e) => setNormFormData({ ...normFormData, fuel_id: e.target.value })}
                >
                  {fuels.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  100 km uchun norma (Litr / Kub)
                </FormLabel>
                <Input
                  type="number"
                  placeholder="Masalan: 8.5"
                  bg="surface"
                  color="text"
                  borderColor="border"
                  focusBorderColor="primary"
                  _hover={{ borderColor: ACCENT }}
                  value={normFormData.norm_per_100km}
                  onChange={(e) => setNormFormData({ ...normFormData, norm_per_100km: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter
            borderTop="1px solid"
            borderColor="border"
            bg="surfBlur"
            borderBottomRadius="xl"
          >
            <Button
              variant="outline"
              borderColor="border"
              color="text"
              _hover={{ bg: "blackAlpha.50" }}
              mr={3}
              onClick={onNormClose}
              size="sm"
              isDisabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              type="submit"
              form="norm-form"
              isLoading={isSubmitting}
              size="sm"
              px={6}
            >
              Normani Saqlash
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
              Siz rostdan ham <b>{carToDelete?.name}</b> avtomobilini o'chirmoqchimisiz?
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