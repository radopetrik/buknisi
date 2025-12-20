import React from 'react';
import { OverlayProvider } from '@gluestack-ui/overlay';
import { View, ViewProps } from 'react-native';

export function GluestackUIProvider({ children, ...props }: ViewProps) {
  return (
    <View style={{ flex: 1 }} {...props}>
        <OverlayProvider>
            {children}
        </OverlayProvider>
    </View>
  );
}
