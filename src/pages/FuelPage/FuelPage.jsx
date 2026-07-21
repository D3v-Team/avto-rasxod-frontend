import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  HStack,
  Center,
  Badge,
  Spinner,
  Icon,
  Select,            // Yangi qo'shilgan komponentlar importi
  SimpleGrid,        
  InputGroup,        
  InputRightElement  
} from '@chakra-ui/react';
import { MoreVertical, Edit, Trash2, Plus, Fuel } from 'lucide-react';

import { apiFuel } from '../../Services/api/Fuels'; // API controller manzili

const initialFormState = {
  unit: '',
  name: '',
  price: '',
};

// Yoqilg'i turlariga qarab semantic tokenlar va Chakra rang sxemalarini moslashtirish
const getFuelTheme = (name) => {
  if (!name) return { token: 'success', scheme: 'teal' };
  const t = name.toLowerCase();
  if (t.includes('benzin') || t.includes('ai')) return { token: 'secondary', scheme: 'orange' };
  if (t.includes('metan') || t.includes('gaz')) return { token: 'accent', scheme: 'cyan' };
  if (t.includes('propan')) return { token: 'primary', scheme: 'purple' };
  return { token: 'success', scheme: 'teal' };
};

export default function FuelPage() {
  // State'lar
  const [fuels, setFuels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal disclosure boshqaruvlari
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [fuelToDelete, setFuelToDelete] = useState(null);

  // Backenddan barcha ma'lumotlarni yuklash funksiyasi
  const fetchFuels = async () => {
    try {
      setLoading(true);
      const res = await apiFuel.All(1, 100);
      setFuels(res.data.data ?? []);
    } catch (error) {
      console.error(error);
      setFuels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(initialFormState);
    onFormOpen();
  };

  const handleOpenEdit = (fuel) => {
    setModalMode('edit');
    setSelectedFuelId(fuel.id);
    setFormData({
      unit: fuel.unit || fuel.type,
      name: fuel.name,
      price: fuel.price,
    });
    onFormOpen();
  };

  const handleOpenDelete = (fuel) => {
    setFuelToDelete(fuel);
    onDeleteOpen();
  };

  // Yaratish va Yangilash amali (Submit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit.trim() || !formData.name.trim() || !formData.price) return;
    
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await apiFuel.Create(formData);
      } else {
        await apiFuel.Update(selectedFuelId, formData);
      }
      onFormClose();
      fetchFuels();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // O'chirish amali
  const handleConfirmDelete = async () => {
    if (!fuelToDelete?.id) return;
    try {
      setLoading(true);
      await apiFuel.Delete(fuelToDelete.id);
      onDeleteClose();
      fetchFuels();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      bg="bg" 
      minH="100vh" 
      p={{ base: 4, md: 8 }}
      transition="background 0.2s ease"
    >
      <Box maxW="container.xl" mx="auto">
        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="text" fontWeight="600">
              Yoqilg'i turlari
            </Heading>
           
          </VStack>
          
          <Button 
            leftIcon={<Plus size={18} />}
            bg="primary"
            color="surface"
            _hover={{ opacity: 0.9 }}
            _active={{ opacity: 0.8 }}
            onClick={handleOpenCreate} 
            size="md"
            px={6}
            boxShadow="sm"
          >
            Yaratish
          </Button>
        </Flex>

        {/* Data Grid Section (Professional Kartochkalar) */}
        {loading ? (
          <Center py={16}>
            <VStack spacing={4}>
              <Spinner size="xl" color="primary" thickness="3px" />
              <Text color="textSecondary" fontSize="sm" fontWeight="medium">Ma'lumotlar yuklanmoqda...</Text>
            </VStack>
          </Center>
        ) : fuels.length === 0 ? (
          <Center py={16}>
            <VStack spacing={3}>
              <Icon as={Fuel} boxSize={10} color="textSecondary" opacity={0.4} />
              <Text color="textSecondary" fontSize="md">Yoqilg'i turlari hali kiritilmagan</Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {fuels.map((fuel) => {
              const fuelTheme = getFuelTheme(fuel.name);
              return (
                <Box
                  key={fuel.id}
                  bg="surface"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border"
                  borderTop={`4px solid var(--chakra-colors-${fuelTheme.token})`}
                  p={5}
                  boxShadow="sm"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "md",
                  }}
                >
                  {/* Kartochka Tepasi */}
                  <Flex justify="space-between" align="start" mb={6}>
                    <HStack spacing={3}>
                      <Center p={2} borderRadius="lg" bg="bg">
                        <Icon as={Fuel} color={fuelTheme.token} boxSize={5} />
                      </Center>
                      <VStack align="start" spacing={0}>
                        <Heading size="sm" color="text" fontWeight="600">
                          {fuel.name}
                        </Heading>
                        <Text fontSize="xs" color="textSecondary" textTransform="lowercase">
                          birligi: {fuel.unit}
                        </Text>
                      </VStack>
                    </HStack>

                    <Menu isLazy placement="bottom-end">
                      <MenuButton
                        as={IconButton}
                        aria-label="Amallar"
                        icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                        color="textSecondary"
                        borderRadius="md"
                        _hover={{ bg: "bg", color: "text" }}
                      />
                      <MenuList minW="140px" boxShadow="lg" bg="surface" borderColor="border">
                        <MenuItem icon={<Edit size={14} />} onClick={() => handleOpenEdit(fuel)} color="text" bg="surface" _hover={{ bg: "bg" }}>
                          Tahrirlash
                        </MenuItem>
                        <MenuItem icon={<Trash2 size={14} />} color="danger" bg="surface" _hover={{ bg: "dangerBg" }} onClick={() => handleOpenDelete(fuel)}>
                          O'chirish
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>

                  {/* Kartochka Pasti */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="10px" fontWeight="700" color="textSecondary" letterSpacing="wider">
                      JORIY NARX
                    </Text>
                    <HStack align="baseline" spacing={1.5}>
                      <Text fontSize="2xl" fontWeight="bold" color="text" letterSpacing="tight">
                        {Number(fuel.price).toLocaleString('uz-UZ')}
                      </Text>
                      <Text fontSize="xs" fontWeight="600" color="textSecondary">
                        UZS
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="lg" boxShadow="xl" bg="surface">
          <ModalHeader bg={"surfBlur"} borderBottom="1px solid" borderColor="border" fontSize="lg" color="text">
            {modalMode === 'create' ? "Yangi yoqilg'i qo'shish" : "Yoqilg'i ma'lumotini tahrirlash"}
          </ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />
          
          <ModalBody bg={"bg"} py={6}>
            <VStack spacing={5} as="form" id="fuel-form" onSubmit={handleSubmit}>
              {/* O'lchov birligi */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  O'lchov birligi
                </FormLabel>
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="Birlikni tanlang"
                  focusBorderColor="primary"
                  color="text"
                  bg="bg"
                  borderColor="border"
                  _hover={{ borderColor: "primary" }}
                >
                  <option value="litr" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>
                    litr (l)
                  </option>
                  <option value="m³" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>
                    kub metr (m³)
                  </option>
                  <option value="kg" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>
                    kilogram (kg)
                  </option>
                </Select>
              </FormControl>

              {/* Markasi yoki Nomi */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Markasi yoki Nomi
                </FormLabel>
                <Select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Yoqilg'i markasini tanlang"
                  focusBorderColor="primary"
                  color="text"
                  bg="bg"
                  borderColor="border"
                  _hover={{ borderColor: "primary" }}
                >
                  <option value="AI-92" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>AI-92</option>
                  <option value="AI-95" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>AI-95</option>
                  <option value="AI-98" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>AI-98</option>
                  <option value="Metan" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>Metan</option>
                  <option value="Propan" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>Propan</option>
                  <option value="Dizel" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>Dizel</option>
                  <option value="Dizel EKO" style={{ background: "var(--chakra-colors-surface)", color: "var(--chakra-colors-text)" }}>Dizel EKO</option>
                </Select>
              </FormControl>

              {/* Narxi */}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color="textSecondary">
                  Narxi
                </FormLabel>
                <InputGroup>
                  <Input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    placeholder="9200" 
                    focusBorderColor="primary"
                    color="text"
                    bg="surface" 
                    borderColor="border"
                    _hover={{ borderColor: "primary" }}
                    pr="4.5rem" 
                  />
                  <InputRightElement width="4.5rem" h="100%" pointerEvents="none">
                    <Text fontSize="xs" fontWeight="bold" color="textSecondary" pr={3}>
                      UZS
                    </Text>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor="border" bg="surfBlur" borderBottomRadius="lg">
            <Button variant="outline" borderColor="border" color="text" _hover={{ bg: "surface" }} mr={3} onClick={onFormClose} size="sm">
              Bekor qilish
            </Button>
            <Button bg="primary" color="surface" _hover={{ opacity: 0.9 }} type="submit" form="fuel-form" isLoading={isSubmitting} size="sm" px={6}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="lg" bg="surface">
          <ModalHeader bg={"surfBlur"} fontSize="lg" color="danger">O'chirishni tasdiqlang</ModalHeader>
          <ModalCloseButton mt={1} color="textSecondary" />
          <ModalBody bg={"bg"} py={4}>
            <Text color="text">
              Siz rostdan ham <b>{fuelToDelete?.name}</b> yoqilg'i ma'lumotini o'chirmoqchimisiz?
            </Text>
            <Text mt={2} fontSize="sm" color="textSecondary">
              Ushbu amalni ortga qaytarib bo'lmaydi.
            </Text>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="border" bg="surfBlur" borderBottomRadius="lg">
            <Button size="sm" variant="outline" borderColor="border" color="text" _hover={{ bg: "surface" }} mr={3} onClick={onDeleteClose}>
              Bekor qilish
            </Button>
            <Button size="sm" bg="danger" color="surface" _hover={{ opacity: 0.9 }} onClick={handleConfirmDelete} isLoading={loading}>
              O'chirish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}