/* eslint-disable react/prop-types */
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Box,
  Text,
} from "@chakra-ui/react";

export default function NormFormFields({
  formData,
  onChange,
  fuels = [],
  isDisabled = false,
  accent = "#3B82F6",
}) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel
          fontSize="xs"
          fontWeight="600"
          color="textSecondary"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Yoqilg&apos;i turi
        </FormLabel>
        <Select
          placeholder="Yonilg&apos;ini tanlang"
          bg="surface"
          color="text"
          borderColor="border"
          borderRadius="xl"
          size="md"
          focusBorderColor={accent}
          _hover={{ borderColor: accent }}
          value={formData.fuel_id}
          onChange={(e) => onChange("fuel_id", e.target.value)}
          isDisabled={isDisabled}
        >
          {fuels.map((fuel) => (
            <option key={fuel.id} value={fuel.id}>
              {fuel.name || fuel.type}
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
          focusBorderColor={accent}
          _hover={{ borderColor: accent }}
          value={formData.norm_per_100km}
          onChange={(e) => onChange("norm_per_100km", e.target.value)}
          isDisabled={isDisabled}
        />
      </FormControl>

      <FormControl>
        <FormLabel
          fontSize="xs"
          fontWeight="600"
          color="textSecondary"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Dastlabki yoqilgisi
        </FormLabel>
        <Input
          type="number"
          placeholder="Masalan: 10 Litr"
          bg="surface"
          color="text"
          borderColor="border"
          borderRadius="xl"
          size="md"
          focusBorderColor={accent}
          _hover={{ borderColor: accent }}
          value={formData.current_balance}
          onChange={(e) => onChange("current_balance", e.target.value)}
          isDisabled={isDisabled}
        />
      </FormControl>

      <FormControl>
        <FormLabel
          fontSize="xs"
          fontWeight="600"
          color="textSecondary"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          Muddati
        </FormLabel>
        <Input
          type="date"
          bg="surface"
          color="text"
          borderColor="border"
          borderRadius="xl"
          size="md"
          focusBorderColor={accent}
          _hover={{ borderColor: accent }}
          value={formData.effective_from}
          onChange={(e) => onChange("effective_from", e.target.value)}
          isDisabled={isDisabled}
        />
      </FormControl>

      <Box
        p={3}
        borderRadius="xl"
        bg="whiteAlpha.50"
        border="1px solid"
        borderColor="border"
      >
        <Text fontSize="xs" fontWeight="600" color="textSecondary">
          Qayd: agar yoqilg&apos;i miqdori bo&apos;sh qolsa, u keyinchalik to&apos;ldiriladi.
        </Text>
      </Box>
    </VStack>
  );
}