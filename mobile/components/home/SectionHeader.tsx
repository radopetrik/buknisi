import React from 'react';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <Box className="px-4 mb-4">
      <Heading className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </Heading>
    </Box>
  );
}
