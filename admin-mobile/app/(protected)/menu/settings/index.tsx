import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SettingsScreen() {
  return (
    <Box className="flex-1 bg-white p-4">
      <Heading size="xl" className="mb-4">Nastavenia</Heading>
      <Text>Všeobecné nastavenia aplikácie</Text>
    </Box>
  );
}
