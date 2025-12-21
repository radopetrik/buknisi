import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <ScrollView className="flex-1 p-4">
        <Box className="mb-6">
          <Heading className="text-2xl font-bold text-text-main">Vitajte doma</Heading>
          <Text className="text-text-muted mt-2">Tu nájdete prehľad vašich aktivít.</Text>
        </Box>
        
        {/* Placeholder content */}
        <Box className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-4">
          <Heading className="text-lg font-bold mb-2">Vaše najbližšie rezervácie</Heading>
          <Text className="text-text-muted">Zatiaľ nemáte žiadne nadchádzajúce rezervácie.</Text>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
