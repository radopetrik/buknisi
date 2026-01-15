import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export function HomeHeader() {
  return (
    <Box className="pb-4 pt-2">
      <Box className="flex-row items-center justify-center mb-4">
        <Heading className="text-3xl font-bold text-white tracking-wide">booksy</Heading>
      </Box>
      <SearchInputTrigger placeholder="Čo hľadáte?" />
    </Box>
  );
}
