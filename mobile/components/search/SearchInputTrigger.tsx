import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { SearchIcon } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';

type SearchInputTriggerProps = {
  placeholder?: string;
};

export function SearchInputTrigger({ placeholder = 'Čo hľadáte?' }: SearchInputTriggerProps) {
  return (
    <Pressable onPress={() => router.push('/search')}>
      <Box pointerEvents="none">
        <Input size="lg" variant="rounded" className="bg-white border-0 h-12" isReadOnly={true}>
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} className="text-gray-400" />
          </InputSlot>
          <InputField
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            className="text-base"
            editable={false}
          />
        </Input>
      </Box>
    </Pressable>
  );
}
