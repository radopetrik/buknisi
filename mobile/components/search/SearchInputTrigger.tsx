import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { SearchIcon } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';

type SearchInputTriggerProps = {
  placeholder?: string;
  className?: string;
};

export function SearchInputTrigger({ placeholder = 'Čo hľadáte?', className }: SearchInputTriggerProps) {
  return (
    <Pressable onPress={() => router.push('/search')}>
      <Box pointerEvents="none">
        <Input
          variant="rounded"
          className={`bg-white h-14 border border-gray-200 shadow-sm ${className}`}
          isReadOnly={true}
        >
          <InputSlot className="pl-4">
            <InputIcon as={SearchIcon} className="text-gray-500" />
          </InputSlot>
          <InputField
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            className="text-base text-text-main"
            editable={false}
          />
        </Input>
      </Box>
    </Pressable>
  );
}
