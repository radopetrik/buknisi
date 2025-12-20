import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function StaffScreen() {
  return (
    <Box className="flex-1 bg-white p-4">
      <Heading size="xl" className="mb-4">Zamestnanci</Heading>
      <Text>Správa zamestnancov</Text>
    </Box>
  );
}
