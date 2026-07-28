/* eslint-disable react/prop-types */
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Flex,
  Text,
  HStack,
  Center,
  VStack,
  Button,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
} from "@chakra-ui/react";
import { Fuel, PencilLine, History, Trash2, Car as CarIcon, AlertTriangle } from "lucide-react";
import NormFormFields from "./NormFormFields";
import NormSelector from "./NormSelector";
import NormEmptyState from "./NormEmptyStates";

const ACCENT = "#3B82F6";

const TAB_CONFIG = [
  { key: "create", label: "Yangi norma", icon: Fuel },
  { key: "edit", label: "Tahrirlash", icon: PencilLine },
  { key: "history", label: "Tarixni o'zgartirish", icon: History },
  { key: "delete", label: "O'chirish", icon: Trash2 },
];

function formatPlateNumber(plate) {
  if (!plate) return { region: "20", main: "" };
  const clean = plate.replace(/\s+/g, "").toUpperCase();
  const region = clean.slice(0, 2);
  const rest = clean.slice(2);
  const formattedMain = rest
    .replace(/(\d+)([A-Z]+)/g, "$1 $2")
    .replace(/([A-Z]+)(\d+)/g, "$1 $2");

  return { region, main: formattedMain };
}

function SectionLabel({ children }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="700"
      color="textSecondary"
      textTransform="uppercase"
      letterSpacing="0.05em"
    >
      {children}
    </Text>
  );
}

function CarSummaryBar({ car }) {
  const { region, main } = formatPlateNumber(car?.plate_number);

  return (
    <Box px={6} py={3} borderBottom="1px solid" borderColor="border" bg="surface">
      <Flex align="center" justify="space-between" gap={3}>
        <Box>
          <SectionLabel>Biriktirilgan avtomobil</SectionLabel>
          <Flex align="center" gap={2} mt={0.5}>
            <Text fontWeight="600" color="text" fontSize="sm">
              {car?.name || "Avtomobil tanlanmagan"}
            </Text>
            {car?.plate_number && (
              <Badge
                bg="white"
                color="black"
                border="1px solid #000"
                borderRadius="md"
                px={1.5}
                py={0.2}
                fontFamily="monospace"
                fontSize="xs"
                fontWeight="800"
                letterSpacing="0.5px"
              >
                {`${region} ${main}`.trim()}
              </Badge>
            )}
          </Flex>
        </Box>
        <Center w="36px" h="36px" borderRadius="lg" bg={`${ACCENT}15`} color={ACCENT}>
          <CarIcon size={18} />
        </Center>
      </Flex>
    </Box>
  );
}

/* Form maydonlarini 2 ustunga majburiy ajratuvchi o'ragich */
function GridFormWrapper({ children }) {
  return (
    <Box
      sx={{
        "& > div, & > form": {
          display: "grid !important",
          gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
          gap: "12px !important",
        },
      }}
    >
      {children}
    </Box>
  );
}

function CreateTab({ formData, onFieldChange, fuels, onCreate, isSubmitting }) {
  return (
    <Flex direction="column" justify="space-between" h="100%">
      <Box>
        <Text fontSize="xs" color="gray.400" mb={3}>
          Ushbu avtomobil uchun yangi yoqilg'i me'yorlarini va qo'shimcha parametrlarini kiriting.
        </Text>
        <GridFormWrapper>
          <NormFormFields formData={formData} onChange={onFieldChange} fuels={fuels} accent={ACCENT} />
        </GridFormWrapper>
      </Box>
      <Button
        mt={5}
        bg={ACCENT}
        color="white"
        _hover={{ bg: "#2563EB" }}
        onClick={onCreate}
        isLoading={isSubmitting}
        w="full"
        size="md"
        borderRadius="xl"
        fontWeight="600"
      >
        Normani saqlash
      </Button>
    </Flex>
  );
}

function SelectorFormLayout({ selector, children }) {
  return (
    <Flex direction={{ base: "column", md: "row" }} align="stretch" gap={5} h="100%">
      <Box flex={{ base: "none", md: "0 0 230px" }} w={{ base: "100%", md: "230px" }}>
        {selector}
      </Box>
      <Divider orientation="vertical" borderColor="border" display={{ base: "none", md: "block" }} />
      <Divider borderColor="border" display={{ base: "block", md: "none" }} />
      <Box flex="1" minW={0} display="flex" flexDirection="column" justifyContent="space-between">
        {children}
      </Box>
    </Flex>
  );
}

function EditTab({
  normOptions,
  isLoading,
  selectedNormId,
  onSelectNorm,
  formData,
  onFieldChange,
  fuels,
  onEdit,
  isSubmitting,
}) {
  return (
    <SelectorFormLayout
      selector={
        <NormSelector
          normOptions={normOptions}
          isLoading={isLoading}
          selectedNormId={selectedNormId}
          onSelectNorm={onSelectNorm}
          emptyMessage="Tahrirlash uchun norma topilmadi."
        />
      }
    >
      {selectedNormId ? (
        <Flex direction="column" justify="space-between" h="100%">
          <Box>
            <Text fontSize="xs" color="gray.400" mb={3}>
              Tanlangan me'yor ko'rsatkichlarini tahrirlang va yangilang.
            </Text>
            <GridFormWrapper>
              <NormFormFields formData={formData} onChange={onFieldChange} fuels={fuels} accent={ACCENT} />
            </GridFormWrapper>
          </Box>
          <Button
            mt={5}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            onClick={onEdit}
            isLoading={isSubmitting}
            w="full"
            size="md"
            borderRadius="xl"
            fontWeight="600"
          >
            O'zgarishlarni yangilash
          </Button>
        </Flex>
      ) : (
        !isLoading &&
        normOptions.length > 0 && (
          <NormEmptyState message="Tahrirlash uchun chap bo'limdan normani tanlang." />
        )
      )}
    </SelectorFormLayout>
  );
}

function HistoryTab({
  normOptions,
  isLoading,
  selectedNormId,
  onSelectNorm,
  historyValue,
  onHistoryChange,
  historyEffectiveFrom,
  onHistoryEffectiveFromChange,
  onHistory,
  isSubmitting,
}) {
  return (
    <SelectorFormLayout
      selector={
        <NormSelector
          normOptions={normOptions}
          isLoading={isLoading}
          selectedNormId={selectedNormId}
          onSelectNorm={onSelectNorm}
          emptyMessage="Tarixni o'zgartirish uchun norma yo'q."
        />
      }
    >
      {selectedNormId ? (
        <Flex direction="column" justify="space-between" h="100%">
          <Box>
            <Text fontSize="xs" color="gray.400" mb={4}>
              Yangi norma va uning kuchga kirish sanasini belgilang.
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" mb={1.5}>
                  Yangi norma (100 km uchun)
                </FormLabel>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Masalan: 8.5"
                  value={historyValue}
                  onChange={(e) => onHistoryChange(e.target.value)}
                  focusBorderColor={ACCENT}
                  borderRadius="xl"
                  size="md"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="600" mb={1.5}>
                  Amal qilish sanasi
                </FormLabel>
                <Input
                  type="date"
                  value={historyEffectiveFrom}
                  onChange={(e) => onHistoryEffectiveFromChange(e.target.value)}
                  focusBorderColor={ACCENT}
                  borderRadius="xl"
                  size="md"
                />
              </FormControl>
            </SimpleGrid>
          </Box>
          <Button
            mt={5}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#2563EB" }}
            onClick={onHistory}
            isLoading={isSubmitting}
            isDisabled={!historyValue || !historyEffectiveFrom}
            w="full"
            size="md"
            borderRadius="xl"
            fontWeight="600"
          >
            Tarixni saqlash
          </Button>
        </Flex>
      ) : (
        !isLoading &&
        normOptions.length > 0 && (
          <NormEmptyState message="Tarixni kiritish uchun ro'yxatdan normani tanlang." />
        )
      )}
    </SelectorFormLayout>
  );
}

function DeleteTab({
  normOptions,
  isLoading,
  selectedNormId,
  onSelectNorm,
  onDelete,
  isSubmitting,
}) {
  return (
    <SelectorFormLayout
      selector={
        <NormSelector
          normOptions={normOptions}
          isLoading={isLoading}
          selectedNormId={selectedNormId}
          onSelectNorm={onSelectNorm}
          emptyMessage="O'chirish uchun norma yo'q."
        />
      }
    >
      {selectedNormId ? (
        <Flex direction="column" justify="space-between" h="100%">
          <Box pt={1}>
            <Alert status="error" variant="subtle" borderRadius="xl" py={3.5} px={4}>
              <AlertIcon as={AlertTriangle} boxSize={5} />
              <Box flex="1">
                <Text fontWeight="600" fontSize="sm">
                  Diqqat! Normani o'chirish
                </Text>
                <AlertDescription fontSize="xs" display="block" mt={1}>
                  Ushbu norma tizimdan butunlay o'chiriladi. Ushbu amalni ortga qaytarib bo'lmaydi.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
          <Button
            mt={5}
            bg="red.500"
            color="white"
            _hover={{ bg: "red.600" }}
            onClick={onDelete}
            isLoading={isSubmitting}
            w="full"
            size="md"
            borderRadius="xl"
            fontWeight="600"
          >
            Normani tasdiqlab o'chirish
          </Button>
        </Flex>
      ) : (
        !isLoading &&
        normOptions.length > 0 && (
          <NormEmptyState message="O'chirish uchun chap tarafdan normani tanlang." />
        )
      )}
    </SelectorFormLayout>
  );
}

export default function NormModal({
  isOpen,
  onClose,
  car,
  fuels,
  activeTab,
  onTabChange,
  formData,
  onFieldChange,
  onCreate,
  onEdit,
  onHistory,
  onDelete,
  isSubmitting,
  isLoading,
  normOptions = [],
  selectedNormId,
  onSelectNorm,
  historyValue,
  onHistoryChange,
  historyEffectiveFrom,
  onHistoryEffectiveFromChange,
}) {
  const activeIndex = TAB_CONFIG.findIndex((tab) => tab.key === activeTab);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
      <ModalContent
        borderRadius="2xl"
        boxShadow="2xl"
        bg="surface"
        overflow="hidden"
        maxW="820px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader borderBottom="1px solid" borderColor="border" py={3.5} px={6} flexShrink={0}>
          <HStack spacing={3} align="center">
            <Center w="36px" h="36px" borderRadius="xl" bg={`${ACCENT}15`} color={ACCENT}>
              <Fuel size={18} />
            </Center>
            <Box>
              <Text fontSize="md" fontWeight="700" color="text" lineHeight="1.2">
                Yoqilg'i sarfi normasini boshqarish
              </Text>
              <Text fontSize="xs" color="textSecondary" mt={0.5}>
                Transport vositalarining yoqilg'i me'yorlarini sozlash
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton mt={1} mr={1} color="textSecondary" borderRadius="lg" />

        <ModalBody bg="bg" p={0} flex="1" display="flex" flexDirection="column" overflowY="auto">
          <CarSummaryBar car={car} />

          <Box p={6} flex="1" display="flex" flexDirection="column" bg="surface">
            <Tabs
              index={activeIndex}
              onChange={(index) => onTabChange(TAB_CONFIG[index].key)}
              variant="unstyled"
              isLazy
              display="flex"
              flexDirection="column"
              h="100%"
            >
              <TabList bg="gray.800" p={1} borderRadius="xl" gap={1.5} flexShrink={0}>
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Tab
                      key={tab.key}
                      flex="1"
                      py={2}
                      px={3}
                      borderRadius="lg"
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.400"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={1.5}
                      transition="all 0.2s"
                      _selected={{
                        bg: ACCENT,
                        color: "white",
                        boxShadow: "sm",
                      }}
                    >
                      <Icon size={15} />
                      {tab.label}
                    </Tab>
                  );
                })}
              </TabList>

              <TabPanels mt={5} flex="1">
                <TabPanel p={0} h="100%">
                  <CreateTab
                    formData={formData}
                    onFieldChange={onFieldChange}
                    fuels={fuels}
                    onCreate={onCreate}
                    isSubmitting={isSubmitting}
                  />
                </TabPanel>

                <TabPanel p={0} h="100%">
                  <EditTab
                    normOptions={normOptions}
                    isLoading={isLoading}
                    selectedNormId={selectedNormId}
                    onSelectNorm={onSelectNorm}
                    formData={formData}
                    onFieldChange={onFieldChange}
                    fuels={fuels}
                    onEdit={onEdit}
                    isSubmitting={isSubmitting}
                  />
                </TabPanel>

                <TabPanel p={0} h="100%">
                  <HistoryTab
                    normOptions={normOptions}
                    isLoading={isLoading}
                    selectedNormId={selectedNormId}
                    onSelectNorm={onSelectNorm}
                    historyValue={historyValue}
                    onHistoryChange={onHistoryChange}
                    historyEffectiveFrom={historyEffectiveFrom}
                    onHistoryEffectiveFromChange={onHistoryEffectiveFromChange}
                    onHistory={onHistory}
                    isSubmitting={isSubmitting}
                  />
                </TabPanel>

                <TabPanel p={0} h="100%">
                  <DeleteTab
                    normOptions={normOptions}
                    isLoading={isLoading}
                    selectedNormId={selectedNormId}
                    onSelectNorm={onSelectNorm}
                    onDelete={onDelete}
                    isSubmitting={isSubmitting}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="border" bg="surface" py={3} px={6} flexShrink={0}>
          <Button
            variant="ghost"
            color="textSecondary"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
            onClick={onClose}
            size="sm"
            borderRadius="xl"
            isDisabled={isSubmitting}
          >
            Yopish
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
