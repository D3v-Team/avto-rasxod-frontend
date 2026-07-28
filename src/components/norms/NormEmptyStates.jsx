/* eslint-disable react/prop-types */
import { Center, VStack, Text } from "@chakra-ui/react";
import { MousePointerClick } from "lucide-react";

export default function NormEmptyState({ message }) {
  return (
    <Center
      py={8}
      px={4}
      bg="blackAlpha.50"
      borderRadius="lg"
      border="1px dashed"
      borderColor="border"
    >
      <VStack spacing={2}>
        <MousePointerClick size={20} color="var(--chakra-colors-textSecondary)" />
        <Text fontSize="sm" color="textSecondary" textAlign="center" maxW="260px">
          {message}
        </Text>
      </VStack>
    </Center>
  );
}