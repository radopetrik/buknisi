import { Alert, FlatList, RefreshControl } from "react-native";
import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, Trash2, ChevronLeft, User as UserIcon } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/lib/supabase";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type RatingProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type RatingRow = {
  id: string;
  rating: number;
  note: string | null;
  created_at: string;
  user_id: string;
  profiles: RatingProfile | RatingProfile[] | null;
};

type RatingStats = {
  average: number;
  count: number;
};

function normalizeProfile(profile: RatingRow["profiles"]): RatingProfile | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile;
}

function formatUserName(profile: RatingProfile | null): string {
  const first = profile?.first_name?.trim() ?? "";
  const last = profile?.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = profile?.email?.trim();
  if (email) return email;
  return "Neznámy používateľ";
}

function getInitial(profile: RatingProfile | null): string | null {
  const first = profile?.first_name?.trim();
  if (first) return first[0]?.toUpperCase() ?? null;
  const email = profile?.email?.trim();
  if (email) return email[0]?.toUpperCase() ?? null;
  return null;
}

async function fetchCompanyRatings(companyId: string): Promise<{ ratings: RatingRow[]; stats: RatingStats }> {
  const [ratingsResult, companyResult] = await Promise.all([
    supabase
      .from("company_ratings")
      .select(
        `
          id,
          rating,
          note,
          created_at,
          user_id,
          profiles (
            first_name,
            last_name,
            email
          )
        `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("rating, rating_count").eq("id", companyId).single(),
  ]);

  if (ratingsResult.error) throw ratingsResult.error;
  if (companyResult.error) throw companyResult.error;

  const ratings = (ratingsResult.data ?? []) as RatingRow[];

  return {
    ratings,
    stats: {
      average: Number(companyResult.data?.rating) || 0,
      count: companyResult.data?.rating_count || 0,
    },
  };
}

export default function RatingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ratingsQuery = useQuery({
    queryKey: ["companyRatings", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchCompanyRatings(company!.id),
  });

  const stats = ratingsQuery.data?.stats ?? { average: 0, count: 0 };

  const normalizedRatings = useMemo(() => {
    return (ratingsQuery.data?.ratings ?? []).map((row) => ({
      ...row,
      profiles: normalizeProfile(row.profiles),
    })) as (Omit<RatingRow, "profiles"> & { profiles: RatingProfile | null })[];
  }, [ratingsQuery.data?.ratings]);

  const handleDelete = (ratingId: string) => {
    if (!company?.id) return;

    Alert.alert("Zmazať hodnotenie", "Naozaj chcete zmazať toto hodnotenie?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Zmazať",
        style: "destructive",
        onPress: async () => {
          setDeletingId(ratingId);

          try {
            const result = await supabase
              .from("company_ratings")
              .delete()
              .eq("id", ratingId)
              .eq("company_id", company.id);

            if (result.error) throw result.error;

            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["companyRatings", company.id] }),
              queryClient.invalidateQueries({ queryKey: ["company"] }),
            ]);
          } catch (err: any) {
            Alert.alert("Chyba", err?.message ?? "Nepodarilo sa zmazať hodnotenie.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">Hodnotenia</Text>
          </HStack>
        </HStack>
      </Box>

      {!company?.id || ratingsQuery.isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : ratingsQuery.isError ? (
        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-700 text-center">
            {(ratingsQuery.error as any)?.message ?? "Nepodarilo sa načítať hodnotenia."}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={normalizedRatings}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={ratingsQuery.isFetching} onRefresh={ratingsQuery.refetch} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          ListHeaderComponent={() => (
            <VStack className="gap-4 mb-4">
              <Box className="bg-white rounded-xl border border-gray-100 p-4">
                <HStack className="items-center justify-between">
                  <Text className="text-sm text-gray-600">Celkové hodnotenie</Text>
                  <Star size={18} color="#f59e0b" fill="#f59e0b" />
                </HStack>
                <Text className="text-3xl font-bold text-gray-900 mt-2">{stats.average.toFixed(1)}</Text>
                <Text className="text-sm text-gray-500 mt-1">z {stats.count} hodnotení</Text>
              </Box>

              <Text className="text-base font-semibold text-gray-900">Zoznam hodnotení</Text>
            </VStack>
          )}
          ListEmptyComponent={() => (
            <Box className="items-center justify-center py-10">
              <Text className="text-gray-600">Zatiaľ žiadne hodnotenia.</Text>
            </Box>
          )}
          renderItem={({ item }) => (
            <RatingItem
              rating={item}
              deleting={deletingId === item.id}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}
    </Box>
  );
}

function RatingItem(props: {
  rating: Omit<RatingRow, "profiles"> & { profiles: RatingProfile | null };
  deleting: boolean;
  onDelete: () => void;
}) {
  const profile = props.rating.profiles;
  const name = formatUserName(profile);
  const initial = getInitial(profile);
  const createdAt = useMemo(() => {
    try {
      return new Date(props.rating.created_at).toLocaleDateString("sk-SK");
    } catch {
      return "";
    }
  }, [props.rating.created_at]);

  return (
    <Box className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
      <HStack className="items-start justify-between gap-3">
        <HStack className="items-start gap-3 flex-1">
          <Box className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
            {initial ? (
              <Text className="text-gray-900 font-semibold">{initial}</Text>
            ) : (
              <UserIcon size={18} color="#6b7280" />
            )}
          </Box>

          <Box className="flex-1">
            <HStack className="items-center flex-wrap gap-2">
              <Text className="text-gray-900 font-semibold">{name}</Text>
              {createdAt ? <Text className="text-gray-500">• {createdAt}</Text> : null}
            </HStack>

            <HStack className="items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < props.rating.rating;
                return (
                  <Star
                    key={i}
                    size={16}
                    color={filled ? "#f59e0b" : "#d1d5db"}
                    fill={filled ? "#f59e0b" : "none"}
                  />
                );
              })}
            </HStack>

            {props.rating.note ? (
              <Text className="text-gray-600 mt-2">{props.rating.note}</Text>
            ) : null}
          </Box>
        </HStack>

        <Pressable onPress={props.onDelete} disabled={props.deleting} className="p-2" hitSlop={8}>
          {props.deleting ? <Spinner size="small" color="#111827" /> : <Trash2 size={18} color="#ef4444" />}
        </Pressable>
      </HStack>
    </Box>
  );
}
