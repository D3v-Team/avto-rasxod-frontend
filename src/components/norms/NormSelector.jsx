/* eslint-disable react/prop-types */
import {
  Box,
  VStack,
  HStack,
  Text,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import { Check, Fuel } from "lucide-react";

const ACCENT = "#3B82F6";

function formatEffectiveDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("uz-UZ");
}

function NormCard({ item, isSelected, onSelect }) {
  const fuelLabel = item.fuel?.name || item.fuel?.type || "Yoqilg'i";
  const effectiveDate = formatEffectiveDate(item.effective_from);

  return (
    <Box
      as="button"
      type="button"
      onClick={() => onSelect(item.id)}
      w="100%"
      textAlign="left"
      p={2.5}
      borderRadius="lg"
      border="1px solid"
      borderColor={isSelected ? ACCENT : "border"}
      borderWidth={isSelected ? "1.5px" : "1px"}
      bg={isSelected ? `${ACCENT}14` : "surface"}
      transition="all 0.15s ease"
      _hover={{ borderColor: ACCENT }}
    >
      <HStack justify="space-between" align="center" spacing={3}>
        <HStack spacing={2.5} minW={0}>
          <Center
            w="28px"
            h="28px"
            minW="28px"
            borderRadius="md"
            bg={isSelected ? `${ACCENT}20` : "blackAlpha.50"}
            color={isSelected ? ACCENT : "textSecondary"}
            flexShrink={0}
          >
            <Fuel size={14} />
          </Center>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="600" color="text" noOfLines={1}>
              {fuelLabel}
            </Text>
            <Text fontSize="xs" color="textSecondary" noOfLines={1}>
              {Number(item.norm_per_100km || 0).toFixed(1)} L/100km
              {effectiveDate ? ` · ${effectiveDate}` : ""}
            </Text>
          </Box>
        </HStack>

        {isSelected && (
          <Center
            w="20px"
            h="20px"
            minW="20px"
            borderRadius="full"
            bg={ACCENT}
            color="white"
            flexShrink={0}
          >
            <Check size={12} strokeWidth={3} />
          </Center>
        )}
      </HStack>
    </Box>
  );
}

export default function NormSelector({
  normOptions = [],
  selectedNormId,
  onSelectNorm,
  isLoading = false,
  emptyMessage = "Bu avtomobil uchun hozircha norma yo'q.",
  label = "Mavjud normalar",
}) {
  if (isLoading) {
    return (
      <Center py={6}>
        <Spinner color={ACCENT} size="sm" thickness="2.5px" />
      </Center>
    );
  }

  if (normOptions.length === 0) {
    return (
      <Alert status="info" borderRadius="lg" fontSize="sm" py={2.5}>
        <AlertIcon />
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="600"
        color="textSecondary"
        textTransform="uppercase"
        letterSpacing="0.5px"
        mb={2}
      >
        {label}
      </Text>
      <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto" pr={1}>
        {normOptions.map((item) => (
          <NormCard
            key={item.id}
            item={item}
            isSelected={selectedNormId === item.id}
            onSelect={onSelectNorm}
          />
        ))}
      </VStack>
    </Box>
  );
}