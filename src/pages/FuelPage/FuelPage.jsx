import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
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
  SimpleGrid,
  Text,
  HStack,
} from '@chakra-ui/react';
import { MoreVertical, Edit, Trash2, Fuel } from 'lucide-react';

const focusStyle = {
  borderColor: "primary",
  boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)",
  outline: "none",
};

// Boshlang'ich Fake Data
const initialFuelData = [
  { id: '1', type: 'Benzin', name: 'AI-95', price: 9200 },
  { id: '2', type: 'Gaz', name: 'Siqilgan gaz (Metan)', price: 3400 },
  { id: '3', type: 'Propan', name: 'Suyultirilgan gaz', price: 6500 },
];

const initialFormState = {
  type: '',
  name: '',
  price: '',
};

// Yoqilg'i turlariga qarab chap tomondagi chiziq rangini aniqlash
const getIndicatorColor = (type) => {
  const t = type.toLowerCase();
  if (t.includes('benzin')) return 'orange.400';
  if (t.includes('metan') || t.includes('gaz')) return 'cyan.400';
  if (t.includes('propan')) return 'purple.400';
  return 'teal.400';
};

export default function FuelPage() {
  const [fuels, setFuels] = useState(initialFuelData);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFuelId, setSelectedFuelId] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [fuelToDelete, setFuelToDelete] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
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
      type: fuel.type,
      name: fuel.name,
      price: fuel.price,
    });
    onFormOpen();
  };

  const handleOpenDelete = (id) => {
    setFuelToDelete(id);
    onDeleteOpen();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      const newFuel = {
        id: Date.now().toString(),
        ...formData,
      };
      setFuels((prev) => [...prev, newFuel]);
    } else {
      setFuels((prev) =>
        prev.map((f) => (f.id === selectedFuelId ? { ...f, ...formData } : f))
      );
    }
    onFormClose();
  };

  const handleConfirmDelete = () => {
    setFuels((prev) => prev.filter((f) => f.id !== fuelToDelete));
    onDeleteClose();
  };

  return (
    <Box 
      pt={{ base: "12px", md: "20px" }} 
      pb={{ base: "12px", md: "20px" }} 
      pl={{ base: "12px", md: "25px" }}  
      pr={{ base: "12px", md: "24px" }}  
      w="100%"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb="32px" gap={4}>
        <Heading size={{ base: "md", md: "lg" }} fontWeight="bold" letterSpacing="tight">
          Yoqilg'i turlari
        </Heading>
        <Button 
          bg="secondary" 
          color="white" 
          onClick={handleOpenCreate} 
          size={{ base: "sm", md: "md" }}
          _hover={{ opacity: 0.9 }}
          px={6}
          borderRadius="lg"
        >
          Yaratish
        </Button>
      </Flex>

      {/* Modern Kartalar Grid paneli */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={6}>
        {fuels.map((fuel) => {
          const indicatorColor = getIndicatorColor(fuel.type);
          return (
            <Card 
              key={fuel.id} 
              bg="surfBlur" 
              border="1px solid" 
              borderColor="border" 
              borderRadius="2xl"
              position="relative"
              overflow="hidden"
              transition="all 0.25s ease"
              _hover={{
                transform: "translateY(-4px)",
                borderColor: indicatorColor,
                boxShadow: "0 12px 20px -10px rgba(0,0,0,0.3)"
              }}
            >
              {/* Chap tomondagi modern rangli indicator */}
              <Box 
                position="absolute" 
                left={0} 
                top={0} 
                bottom={0} 
                w="5px" 
                bg={indicatorColor}
              />

              <CardHeader pt={5} pb={1} pl={6} pr={4}>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Fuel size={14} color={`var(--chakra-colors-${indicatorColor})`} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="textSub" tracking="widest">
                      {fuel.type}
                    </Text>
                  </HStack>
                  
                  <Menu isLazy>
                    <MenuButton
                      as={IconButton}
                      aria-label="Amallar"
                      icon={<MoreVertical size={16} />}
                      variant="ghost"
                      size="sm"
                      borderRadius="full"
                      color="textSub"
                      _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    />
                    <MenuList>
                      <MenuItem icon={<Edit size={14} />} onClick={() => handleOpenEdit(fuel)}>
                        Tahrirlash
                      </MenuItem>
                      <MenuItem icon={<Trash2 size={14} />} color="red.400" onClick={() => handleOpenDelete(fuel.id)}>
                        O'chirish
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </CardHeader>
              
              <CardBody pl={6} pr={6} pb={5} pt={2}>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md" fontWeight="semibold" color="white">
                    {fuel.name}
                  </Heading>
                  
                  <Flex justify="space-between" align="baseline" pt={2} borderTop="1px solid" borderColor="whiteAlpha.100">
                    <Text fontSize="xs" color="textSub">Joriy narxi:</Text>
                    <Text fontSize="xl" fontWeight="extrabold" color="yellow.400">
                      {Number(fuel.price).toLocaleString('uz-UZ')} <Text as="span" fontSize="xs" fontWeight="normal" color="textSub">so'm</Text>
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size={{ base: "full", sm: "md" }} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius={{ base: "0px", sm: "xl" }} as="form" onSubmit={handleSubmit}>
          <ModalHeader bg="surfBlur" borderTopRadius={{ base: "0px", sm: "xl" }} fontSize="md" fontWeight="bold">
            {modalMode === 'create' ? "Yangi yoqilg'i kiritish" : "Yoqilg'ini tahrirlash"}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody bg="bg" py={5}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="textSub">Yoqilg'i turi</FormLabel>
                <Input bg="surfBlur" _focus={focusStyle} borderRadius="lg" name="type" value={formData.type} onChange={handleChange} placeholder="Masalan: Benzin, Gaz, Propan" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" color="textSub">Markasi / Nomi</FormLabel>
                <Input bg="surfBlur" _focus={focusStyle} borderRadius="lg" name="name" value={formData.name} onChange={handleChange} placeholder="Masalan: AI-95, Metan" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" color="textSub">Narxi (so'mda)</FormLabel>
                <Input bg="surfBlur" _focus={focusStyle} borderRadius="lg" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="9200" />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg="surfBlur" borderBottomRadius={{ base: "0px", sm: "xl" }}>
            <Button border="1px solid" borderColor="whiteAlpha.300" variant="gho" mr={3} onClick={onFormClose} size="sm" borderRadius="lg">
              Bekor qilish
            </Button>
            <Button bg="secondary" color="white" type="submit" size="sm" borderRadius="lg" px={5}>
              Saqlash
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="xs">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader bg="surfBlur" borderTopRadius="xl" fontSize="md" fontWeight="bold">O'chirishni tasdiqlash</ModalHeader>
          <ModalCloseButton />
          <ModalBody bg="bg" py={5}>
            <Text fontSize="sm" color="text">Rostdan ham ushbu yoqilg'i ma'lumotini o'chirmoqchimisiz?</Text>
          </ModalBody>
          <ModalFooter bg="surfBlur" borderBottomRadius="xl">
            <Button size="sm" variant="gho" mr={2} onClick={onDeleteClose} borderRadius="lg">Yo'q</Button>
            <Button size="sm" bg="secondary" color="white" onClick={handleConfirmDelete} borderRadius="lg">Ha, o'chirish</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}