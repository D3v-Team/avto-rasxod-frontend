import { useState,  useEffect } from "react";
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
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Car as CarIcon } from "lucide-react";
import { apiCars } from "../../Services/api/Cars"; 
import { apiEmployees } from "../../Services/api/Users"; 

const ACCENT = "#3B82F6";

// Inputlarni boshqarish uchun qulay forma holati
const emptyForm = { 
  name: "", 
  plate_number: "", 
  driver_id: "", 
  responsible_employee_id: "", 
  litr: "", 
  summa: "" 
};

function formatSum(n) {
  return Number(n || 0).toLocaleString("ru-RU") + " so'm";
}

export default function CarPage() {
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  
  const toast = useToast();

  // Haydovchilar ro'yxatini yuklash (Select uchun)
  const fetchDrivers = async () => {
    try {
      const res = await apiEmployees.All();
      const rawData = res.data?.data || res.data || [];
      setDrivers(rawData);
    } catch (error) {
      console.error("Haydovchilarni yuklashda xatolik:", error);
    }
  };

  // Avtomobillarni yuklash
  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await apiCars.All(1, 100, search);
      const rawData = res.data?.data || res.data || [];
      
      const mappedCars = rawData.map((car) => {
        // Objektdan React child xatoligini olmaslik uchun faqat satr (string) ajratib olamiz
        let driverName = "Biriktirilmagan";
        if (car.driver && typeof car.driver === 'object') {
          driverName = car.driver.full_name || "Ismsiz xodim";
        } else if (car.driver_info && typeof car.driver_info === 'object') {
          driverName = car.driver_info.full_name || "Ismsiz xodim";
        } else if (typeof car.driver === 'string') {
          driverName = car.driver;
        }

        return {
          id: car.id,
          name: car.name || car.car_name || "Nomsiz transport",
          plate_number: car.plate_number || car.plate || car.state_number || "",
          driver_name: driverName, // Jadvalda xavfsiz render bo'ladi
          driver_id: car.driver && typeof car.driver === 'object' ? car.driver.id : (car.driver_id || ""),
          responsible_employee_id: car.responsible_employee_id || "",
          litr: Number(car.litr || car.fuel_limit || 0),
          summa: Number(car.summa || car.balance || 0),
        };
      });

      setCars(mappedCars);
    } catch (error) {
      console.error("Avtomobillarni yuklashda xatolik:", error);
      toast({ title: "Ma'lumotlarni yuklab bo'lmadi", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCars();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    onOpen();
  }

  function openEditModal(car) {
    setForm({
      name: car.name,
      plate_number: car.plate_number,
      driver_id: car.driver_id,
      responsible_employee_id: car.responsible_employee_id || car.driver_id, 
      litr: car.litr.toString(),
      summa: car.summa.toString(),
    });
    setEditingId(car.id);
    onOpen();
  }

  // Avtomobil yaratish / tahrirlash (Siz aytgandek `name` jo'natiladi)
  async function handleSave() {
    if (!form.name || !form.plate_number || !form.driver_id) {
      toast({
        title: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 2500,
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: form.name, // car_name emas, name ko'rinishida backend talabiga moslandi
      plate_number: form.plate_number,
      driver_id: form.driver_id,
      responsible_employee_id: form.responsible_employee_id || form.driver_id, 
      litr: Number(form.litr) || 0,
      summa: Number(form.summa) || 0,
    };

    try {
      if (editingId) {
        await apiCars.Update(editingId, payload);
      } else {
        await apiCars.Create(payload);
      }
      onClose();
      fetchCars();
    } catch (error) {
      console.error("Saqlashda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(id) {
    setDeleteId(id);
    onDeleteOpen();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await apiCars.Delete(deleteId);
      onDeleteClose();
      fetchCars();
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* PAGE HEADER */}
      <Flex justify="space-between" align={{ base: "start", md: "center" }} mb={5} direction={{ base: "column", md: "row" }} gap={3}>
        <Box>
          <Heading size="lg" color="text">Avtomobillar</Heading>
          <Text color="textSecondary" fontSize="sm" mt={1}>Balansdagi transport vositalarini boshqarish</Text>
        </Box>
        <Button leftIcon={<Plus size={18} />} bg={ACCENT} color="white" _hover={{ bg: "#2563EB" }} _active={{ bg: "#1D4ED8" }} onClick={openCreateModal}>
          Yangi avtomobil
        </Button>
      </Flex>

      {/* SEARCH + COUNT ROW */}
      <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={4}>
        <InputGroup maxW="320px">
          <InputLeftElement pointerEvents="none">
            <Search size={17} color="var(--chakra-colors-muted)" />
          </InputLeftElement>
          <Input
            placeholder="Qidirish..."
            bg="surface"
            border="1.5px solid"
            borderColor="border"
            _hover={{ borderColor: ACCENT }}
            _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}26` }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Badge fontSize="xs" px={3} py={1.5} borderRadius="lg" bg={`${ACCENT}1A`} color={ACCENT}>
          Jami: {cars.length} ta
        </Badge>
      </Flex>

      {/* TABLE CARD */}
      <Card bg="surface" border="1px solid" borderColor="border">
        <CardBody p={0}>
          {loading ? (
            <Center py={16}>
              <Spinner color={ACCENT} size="lg" thickness="3px" />
            </Center>
          ) : cars.length === 0 ? (
            <Flex direction="column" align="center" py={12} color="muted">
              <CarIcon size={40} />
              <Text mt={3} fontSize="sm">Avtomobil topilmadi</Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border" py={4} pl={6}>Avtomobil</Th>
                    <Th color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border">Davlat raqami</Th>
                    <Th color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border">Haydovchi</Th>
                    <Th isNumeric color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border">Yoqilg'i (L)</Th>
                    <Th isNumeric color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border">Summa</Th>
                    <Th textAlign="center" color="textSecondary" fontSize="xs" letterSpacing="0.5px" borderColor="border" pr={6}>Amallar</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cars.map((car) => (
                    <Tr key={car.id} transition="background 0.15s ease" _hover={{ bg: `${ACCENT}0D` }}>
                      <Td borderColor="border" pl={6}>
                        <Flex align="center" gap={3}>
                          <Box p={2} borderRadius="lg" bg={`${ACCENT}1A`} color={ACCENT} transition="transform 0.2s" _hover={{ transform: "scale(1.1)" }}>
                            <CarIcon size={18} />
                          </Box>
                          <Text fontWeight="600" color="text">{car.name}</Text>
                        </Flex>
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        <Badge variant="outline" colorScheme="gray" px={2} py={0.5} borderRadius="md">{car.plate_number}</Badge>
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        {car.driver_name} {/* Tuzatilgan toza string ma'lumot */}
                      </Td>
                      <Td isNumeric borderColor="border" color="textSecondary">{car.litr.toLocaleString("ru-RU")}</Td>
                      <Td isNumeric borderColor="border" fontWeight="600" color="text">{formatSum(car.summa)}</Td>
                      <Td borderColor="border" pr={6}>
                        <Flex justify="center" gap={2}>
                          <Tooltip label="Tahrirlash">
                            <IconButton icon={<Pencil size={15} />} size="sm" variant="ghost" color={ACCENT} _hover={{ bg: `${ACCENT}1A` }} aria-label="Tahrirlash" onClick={() => openEditModal(car)} />
                          </Tooltip>
                          <Tooltip label="O'chirish">
                            <IconButton icon={<Trash2 size={15} />} size="sm" variant="ghost" color="danger" _hover={{ bg: "dangerBg" }} aria-label="O'chirish" onClick={() => confirmDelete(car.id)} />
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

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="surface">
          <ModalHeader color="text">
            {editingId ? "Avtomobilni tahrirlash" : "Yangi avtomobil qo'shish"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Avtomobil nomi</FormLabel>
              <Input
                placeholder="Masalan: KIA Sportage"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Davlat raqami</FormLabel>
              <Input
                placeholder="Masalan: 20 095 DAV"
                value={form.plate_number}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Haydovchi</FormLabel>
              <Select
                placeholder="Haydovchini tanlang"
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value, responsible_employee_id: e.target.value })}
              >
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.full_name || drv.login}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Flex gap={4}>
              <FormControl mb={2}>
                <FormLabel fontSize="sm">Yoqilg'i (litr)</FormLabel>
                <Input type="number" placeholder="0" value={form.litr} onChange={(e) => setForm({ ...form, litr: e.target.value })} />
              </FormControl>
              <FormControl mb={2}>
                <FormLabel fontSize="sm">Summa (so'm)</FormLabel>
                <Input type="number" placeholder="0" value={form.summa} onChange={(e) => setForm({ ...form, summa: e.target.value })} />
              </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>Bekor qilish</Button>
            <Button bg={ACCENT} color="white" _hover={{ bg: "#2563EB" }} _active={{ bg: "#1D4ED8" }} onClick={handleSave} isLoading={isSubmitting}>
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="surface">
          <ModalHeader color="text" fontSize="lg" borderBottom="1px solid" borderColor="border">
            Avtomobilni o'chirish
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody color="textSecondary" py={6}>
            Rostdan ham bu avtomobilni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
          </ModalBody>
          <ModalFooter gap={3} borderTop="1px solid" borderColor="border">
            <Button variant="ghost" onClick={onDeleteClose} isDisabled={isSubmitting}>Bekor qilish</Button>
            <Button bg="red.500" color="white" _hover={{ bg: "red.600" }} _active={{ bg: "red.700" }} onClick={handleDelete} isLoading={isSubmitting}>
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}