import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useEffect, useState } from "react";
import { isInvalidRefreshTokenError, supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { View } from "react-native";
import SplashScreen from "@/components/splash-screen";

function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            // Token in AsyncStorage is stale/revoked; clear local session.
            await supabase.auth.signOut({ scope: "local" });
          } else {
            console.error("Error getting session:", error);
          }

          if (isMounted) setSession(null);
        } else {
          if (isMounted) setSession(data.session);
        }
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: "local" });
        } else {
          console.error("Error getting session:", error);
        }

        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESH_FAILED") {
        supabase.auth.signOut({ scope: "local" });
        setSession(null);
        return;
      }

      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(protected)";

    if (session && !inProtectedGroup) {
      router.replace("/(protected)/calendar");
    } else if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [session, initialized, segments, router]);

  if (!initialized) {
    return (
      <View className="flex-1">
        <SplashScreen />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(protected)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
