import { Box } from '@/components/ui/box';
import { Image } from '@/components/ui/image';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export function HomeHeader() {
  return (
    <Box className="pb-4 pt-2">
      <Box className="items-center justify-center mb-4">
        <Image
          source={require('@/assets/images/logo_buknisi.png')}
          alt="Buknisi"
          resizeMode="contain"
          size="none"
          style={{ width: 300, height: 74 }}
        />
      </Box>
      <SearchInputTrigger placeholder="Čo hľadáte?" />
    </Box>
  );
}
