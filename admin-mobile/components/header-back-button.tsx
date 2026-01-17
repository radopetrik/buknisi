import React from "react";
import { ChevronLeft } from "lucide-react-native";

import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

type HeaderBackButtonProps = {
  onPress: () => void;
  label?: string;
  className?: string;
  labelClassName?: string;
  iconColor?: string;
  iconSize?: number;
  hitSlop?: number;
  numberOfLines?: number;
};

export function HeaderBackButton({
  onPress,
  label,
  className,
  labelClassName,
  iconColor = "#111827",
  iconSize = 22,
  hitSlop = 8,
  numberOfLines = 1,
}: HeaderBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-2 -ml-2 ${className ?? ""}`}
      hitSlop={hitSlop}
      accessibilityRole="button"
    >
      <HStack className="items-center gap-1">
        <ChevronLeft size={iconSize} color={iconColor} />
        {label ? (
          <Text className={labelClassName ?? "text-base font-semibold text-gray-900"} numberOfLines={numberOfLines}>
            {label}
          </Text>
        ) : null}
      </HStack>
    </Pressable>
  );
}
