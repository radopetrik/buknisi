import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const isWebServer = Platform.OS === "web" && typeof window === "undefined";

const noopStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Expo Router does SSR for web; avoid touching `window`/localStorage there.
    storage: isWebServer ? noopStorage : AsyncStorage,
    autoRefreshToken: !isWebServer,
    persistSession: !isWebServer,
    detectSessionInUrl: false,
  },
});

export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeMessage = "message" in error ? (error as { message?: unknown }).message : undefined;
  if (typeof maybeMessage !== "string") return false;

  return maybeMessage.includes("Invalid Refresh Token");
}
