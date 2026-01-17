import { useCallback, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export default function CreateActionsSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setOpen(true);
      return () => setOpen(false);
    }, [])
  );

  const closeAndGoBack = useCallback(() => {
    setOpen(false);
    try {
      router.back();
    } catch {
      router.replace("/(protected)/calendar");
    }
  }, [router]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeAndGoBack}>
      <Pressable className="flex-1 bg-black/40" onPress={closeAndGoBack}>
        <View className="flex-1 justify-end">
          <Pressable>
            <Box className="bg-white rounded-t-3xl p-5">
              <HStack className="items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">Vytvoriť</Text>
                <Pressable onPress={closeAndGoBack} className="p-2">
                  <Text className="text-base font-bold">×</Text>
                </Pressable>
              </HStack>

              <VStack className="gap-3">
                <Button
                  className="w-full"
                  onPress={() => {
                    setOpen(false);
                    router.replace({
                      pathname: "/(protected)/calendar",
                      params: { create: "1" },
                    });
                  }}
                >
                  <ButtonText>Nový booking</ButtonText>
                </Button>

                <Button
                  variant="outline"
                  action="secondary"
                  className="w-full"
                  onPress={() => {
                    setOpen(false);
                    router.replace({
                      pathname: "/(protected)/dashboard",
                      params: { createPayment: "1" },
                    });
                  }}
                >
                  <ButtonText>Nová platba</ButtonText>
                </Button>

                <Button
                  variant="outline"
                  action="secondary"
                  className="w-full"
                  onPress={closeAndGoBack}
                >
                  <ButtonText>Zrušiť</ButtonText>
                </Button>
              </VStack>
            </Box>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
