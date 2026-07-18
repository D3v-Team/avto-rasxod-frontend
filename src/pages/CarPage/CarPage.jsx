import { useState, useRef } from "react";
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
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Avatar,
  Tooltip,
} from "@chakra-ui/react";
import { Search, Plus, Pencil, Trash2, Car } from "lucide-react";

// Yagona ohang — sof ko'k
const ACCENT = "#3B82F6";

// Fake/mock data — API tayyor bo'lgach almashtiriladi
const initialCars = [
  {
    id: 1,
    name: "KIA Sportage",
    plate: "20 095 DAV",
    driver: "Р.Турсунмурадов",
    litr: 3541,
    summa: 2729824,
  },
  {
    id: 2,
    name: "Tracker",
    plate: "20/227 TAA",
    driver: "Б.Хамидов",
    litr: 2314,
    summa: 1494000,
  },
  {
    id: 3,
    name: "Tracker 2",
    plate: "20/226 SAA",
    driver: "Т.Шодмонов",
    litr: 2411,
    summa: 1254000,
  },
  {
    id: 4,
    name: "Lacetti 1.8",
    plate: "20/227 FAA",
    driver: "Т.Номозов",
    litr: 1669,
    summa: 1017500,
  },
  {
    id: 5,
    name: "Lacetti 1.5",
    plate: "20/226 AAA",
    driver: "У.Манғитов",
    litr: 1515,
    summa: 1021000,
  },
  {
    id: 6,
    name: "Cobalt",
    plate: "20/854 XAA",
    driver: "Ж.Файзиев",
    litr: 1793,
    summa: 1273932,
  },
];

const emptyForm = { name: "", plate: "", driver: "", litr: "", summa: "" };

function formatSum(n) {
  return Number(n || 0).toLocaleString("ru-RU") + " so'm";
}

export default function CarPage() {
  const [cars, setCars] = useState(initialCars);
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
  const cancelRef = useRef();
  const toast = useToast();

  const filteredCars = cars.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.plate.toLowerCase().includes(search.toLowerCase()) ||
      c.driver.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreateModal() {
    setForm(emptyForm);
    setEditingId(null);
    onOpen();
  }

  function openEditModal(car) {
    setForm({
      name: car.name,
      plate: car.plate,
      driver: car.driver,
      litr: car.litr,
      summa: car.summa,
    });
    setEditingId(car.id);
    onOpen();
  }

  function handleSave() {
    if (!form.name || !form.plate || !form.driver) {
      toast({
        title: "Barcha majburiy maydonlarni to'ldiring",
        status: "warning",
        duration: 2500,
      });
      return;
    }

    if (editingId) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...form,
                litr: Number(form.litr),
                summa: Number(form.summa),
              }
            : c,
        ),
      );
      toast({
        title: "Avtomobil yangilandi",
        status: "success",
        duration: 2000,
      });
    } else {
      const newCar = {
        id: Date.now(),
        ...form,
        litr: Number(form.litr) || 0,
        summa: Number(form.summa) || 0,
      };
      setCars((prev) => [...prev, newCar]);
      toast({
        title: "Avtomobil qo'shildi",
        status: "success",
        duration: 2000,
      });
    }

    onClose();
  }

  function confirmDelete(id) {
    setDeleteId(id);
    onDeleteOpen();
  }

  function handleDelete() {
    setCars((prev) => prev.filter((c) => c.id !== deleteId));
    toast({ title: "Avtomobil o'chirildi", status: "info", duration: 2000 });
    onDeleteClose();
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      {/* PAGE HEADER */}
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        mb={5}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Box>
          <Heading size="lg" color="text">
            Avtomobillar
          </Heading>
          <Text color="textSecondary" fontSize="sm" mt={1}>
            Balansdagi transport vositalarini boshqarish
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={18} />}
          bg={ACCENT}
          color="white"
          _hover={{ bg: "#2563EB" }}
          _active={{ bg: "#1D4ED8" }}
          onClick={openCreateModal}
        >
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
          bg={`${ACCENT}1A`}
          color={ACCENT}
        >
          Jami: {filteredCars.length} ta
        </Badge>
      </Flex>

      {/* TABLE CARD */}
      <Card bg="surface" border="1px solid" borderColor="border">
        <CardBody p={0}>
          {filteredCars.length === 0 ? (
            <Flex direction="column" align="center" py={12} color="muted">
              <Car size={40} />
              <Text mt={3} fontSize="sm">
                Avtomobil topilmadi
              </Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th
                      color="textSecondary"
                      fontSize="xs"
                      letterSpacing="0.5px"
                      borderColor="border"
                      py={4}
                      pl={6}
                    >
                      Avtomobil
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
                      isNumeric
                      color="textSecondary"
                      fontSize="xs"
                      letterSpacing="0.5px"
                      borderColor="border"
                    >
                      Yoqilg'i (L)
                    </Th>
                    <Th
                      isNumeric
                      color="textSecondary"
                      fontSize="xs"
                      letterSpacing="0.5px"
                      borderColor="border"
                    >
                      Summa
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
                  {filteredCars.map((car) => (
                    <Tr
                      key={car.id}
                      transition="background 0.15s ease"
                      _hover={{ bg: `${ACCENT}0D` }}
                    >
                      <Td borderColor="border" pl={6}>
                        <Flex align="center" gap={3}>
                          <Avatar
                            size="sm"
                            name={car.name}
                            bg={ACCENT}
                            color="white"
                            fontSize="xs"
                            fontWeight="700"
                          />
                          <Text fontWeight="600" color="text">
                            {car.name}
                          </Text>
                        </Flex>
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        {car.plate}
                      </Td>
                      <Td borderColor="border" color="textSecondary">
                        {car.driver}
                      </Td>
                      <Td isNumeric borderColor="border" color="textSecondary">
                        {car.litr.toLocaleString("ru-RU")}
                      </Td>
                      <Td
                        isNumeric
                        borderColor="border"
                        fontWeight="600"
                        color="text"
                      >
                        {formatSum(car.summa)}
                      </Td>
                      <Td borderColor="border" pr={6}>
                        <Flex justify="center" gap={2}>
                          <Tooltip label="Tahrirlash">
                            <IconButton
                              icon={<Pencil size={15} />}
                              size="sm"
                              variant="ghost"
                              color={ACCENT}
                              _hover={{ bg: `${ACCENT}1A` }}
                              aria-label="Tahrirlash"
                              onClick={() => openEditModal(car)}
                            />
                          </Tooltip>
                          <Tooltip label="O'chirish">
                            <IconButton
                              icon={<Trash2 size={15} />}
                              size="sm"
                              variant="ghost"
                              color="danger"
                              _hover={{ bg: "dangerBg" }}
                              aria-label="O'chirish"
                              onClick={() => confirmDelete(car.id)}
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
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
              />
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm">Haydovchi</FormLabel>
              <Input
                placeholder="Haydovchi F.I.Sh."
                value={form.driver}
                onChange={(e) => setForm({ ...form, driver: e.target.value })}
              />
            </FormControl>
            <Flex gap={4}>
              <FormControl mb={2}>
                <FormLabel fontSize="sm">Yoqilg'i (litr)</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.litr}
                  onChange={(e) => setForm({ ...form, litr: e.target.value })}
                />
              </FormControl>
              <FormControl mb={2}>
                <FormLabel fontSize="sm">Summa (so'm)</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.summa}
                  onChange={(e) => setForm({ ...form, summa: e.target.value })}
                />
              </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#2563EB" }}
              _active={{ bg: "#1D4ED8" }}
              onClick={handleSave}
            >
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="surface">
            <AlertDialogHeader color="text">
              Avtomobilni o'chirish
            </AlertDialogHeader>
            <AlertDialogBody color="textSecondary">
              Rostdan ham bu avtomobilni o'chirmoqchimisiz? Bu amalni ortga
              qaytarib bo'lmaydi.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={onDeleteClose}>
                Bekor qilish
              </Button>
              <Button variant="solidDanger" onClick={handleDelete}>
                O'chirish
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
