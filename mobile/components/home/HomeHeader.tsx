import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Image } from '@/components/ui/image';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export function HomeHeader() {
  return (
    <Box className="pb-4 pt-2">
      <Box className="flex-row items-center justify-center mb-4">
        <Image
          source={require('@/assets/images/logo_buknisi_hlava.png')}
          alt="Buknisi"
          resizeMode="contain"
          style={{ width: 34, height: 34 }}
        />
        <Heading className="text-3xl font-bold text-text-main tracking-wide ml-2">Buknisi</Heading>
      </Box>
      <SearchInputTrigger placeholder="Čo hľadáte?" />
    </Box>
  );
}
