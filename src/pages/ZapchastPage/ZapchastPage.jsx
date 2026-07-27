import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  useDisclosure,
  useToast,
  Flex,
  Badge,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";

// ---- FAKE DATA (backend chiqqach o'chirib, API dan olib kelasiz) ----
const FAKE_PARTS = [
  {
    id: 1,
    nomi: "Dvigatel filtri",
    artikul: "FLT-1001",
    mashina: "Chevrolet Nexia",
    narxi: 45000,
    miqdori: 120,
  },
  {
    id: 2,
    nomi: "Tormoz kolodkasi",
    artikul: "BRK-2045",
    mashina: "Chevrolet Cobalt",
    narxi: 180000,
    miqdori: 35,
  },
  {
    id: 3,
    nomi: "Amortizator",
    artikul: "AMT-3320",
    mashina: "Chevrolet Spark",
    narxi: 320000,
    miqdori: 12,
  },
  {
    id: 4,
    nomi: "Yoqilg'i nasosi",
    artikul: "FPM-4410",
    mashina: "Chevrolet Malibu",
    narxi: 560000,
    miqdori: 8,
  },
  {
    id: 5,
    nomi: "Radiator",
    artikul: "RAD-5501",
    mashina: "Chevrolet Lacetti",
    narxi: 410000,
    miqdori: 0,
  },
];

const emptyForm = { nomi: "", artikul: "", mashina: "", narxi: 0, miqdori: 0 };

function ZapchastPage() {
  const [parts, setParts] = useState(FAKE_PARTS);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure(); // add/edit modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure(); // delete confirm
  const cancelRef = React.useRef();
  const toast = useToast();

  const filteredParts = parts.filter(
    (p) =>
      p.nomi.toLowerCase().includes(search.toLowerCase()) ||
      p.artikul.toLowerCase().includes(search.toLowerCase()) ||
      p.mashina.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEditModal = (part) => {
    setEditingId(part.id);
    setForm({
      nomi: part.nomi,
      artikul: part.artikul,
      mashina: part.mashina,
      narxi: part.narxi,
      miqdori: part.miqdori,
    });
    onOpen();
  };

  const handleSave = () => {
    if (!form.nomi || !form.artikul || !form.mashina) {
      toast({
        title: "Barcha maydonlarni to'ldiring",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    if (editingId) {
      // TODO: backend chiqsa -> await api.put(`/zapchast/${editingId}`, form)
      setParts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)),
      );
      toast({
        title: "Zapchast yangilandi",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      // TODO: backend chiqsa -> await api.post('/zapchast', form)
      const newId = Math.max(0, ...parts.map((p) => p.id)) + 1;
      setParts((prev) => [...prev, { id: newId, ...form }]);
      toast({
        title: "Zapchast qo'shildi",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
    onClose();
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    onDeleteOpen();
  };

  const handleDelete = () => {
    // TODO: backend chiqsa -> await api.delete(`/zapchast/${deletingId}`)
    setParts((prev) => prev.filter((p) => p.id !== deletingId));
    toast({
      title: "Zapchast o'chirildi",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    onDeleteClose();
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={5}>
        <Heading size="lg">Zapchastlar</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={openAddModal}
        >
          Yangi zapchast
        </Button>
      </Flex>

      <InputGroup mb={4} maxW="320px">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Nomi, artikul yoki mashina bo'yicha qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <TableContainer borderWidth="1px" borderRadius="md">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nomi</Th>
              <Th>Artikul</Th>
              <Th>Mashina modeli</Th>
              <Th isNumeric>Narxi (so'm)</Th>
              <Th isNumeric>Miqdori</Th>
              <Th>Holati</Th>
              <Th textAlign="right">Amallar</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredParts.map((part) => (
              <Tr key={part.id}>
                <Td fontWeight="medium">{part.nomi}</Td>
                <Td>{part.artikul}</Td>
                <Td>{part.mashina}</Td>
                <Td isNumeric>{part.narxi.toLocaleString("uz-UZ")}</Td>
                <Td isNumeric>{part.miqdori}</Td>
                <Td>
                  {part.miqdori === 0 ? (
                    <Badge colorScheme="red">Tugagan</Badge>
                  ) : part.miqdori < 15 ? (
                    <Badge colorScheme="yellow">Kam qoldi</Badge>
                  ) : (
                    <Badge colorScheme="green">Yetarli</Badge>
                  )}
                </Td>
                <Td>
                  <Flex justify="flex-end" gap={2}>
                    <IconButton
                      aria-label="Tahrirlash"
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => openEditModal(part)}
                    />
                    <IconButton
                      aria-label="O'chirish"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => confirmDelete(part.id)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
            {filteredParts.length === 0 && (
              <Tr>
                <Td colSpan={7} textAlign="center" color="gray.500" py={8}>
                  Hech narsa topilmadi
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Add / Edit modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingId ? "Zapchastni tahrirlash" : "Yangi zapchast qo'shish"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3} isRequired>
              <FormLabel>Nomi</FormLabel>
              <Input
                value={form.nomi}
                onChange={(e) => setForm({ ...form, nomi: e.target.value })}
                placeholder="Masalan: Tormoz kolodkasi"
              />
            </FormControl>
            <FormControl mb={3} isRequired>
              <FormLabel>Artikul</FormLabel>
              <Input
                value={form.artikul}
                onChange={(e) => setForm({ ...form, artikul: e.target.value })}
                placeholder="Masalan: BRK-2045"
              />
            </FormControl>
            <FormControl mb={3} isRequired>
              <FormLabel>Mashina modeli</FormLabel>
              <Input
                value={form.mashina}
                onChange={(e) => setForm({ ...form, mashina: e.target.value })}
                placeholder="Masalan: Chevrolet Cobalt"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Narxi (so'm)</FormLabel>
              <NumberInput
                min={0}
                value={form.narxi}
                onChange={(valueString) =>
                  setForm({ ...form, narxi: Number(valueString) || 0 })
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Miqdori</FormLabel>
              <NumberInput
                min={0}
                value={form.miqdori}
                onChange={(valueString) =>
                  setForm({ ...form, miqdori: Number(valueString) || 0 })
                }
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Bekor qilish
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Zapchastni o'chirish</AlertDialogHeader>
            <AlertDialogBody>
              Ushbu zapchastni o'chirishga ishonchingiz komilmi? Bu amalni bekor
              qilib bo'lmaydi.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Bekor qilish
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                O'chirish
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default ZapchastPage;
