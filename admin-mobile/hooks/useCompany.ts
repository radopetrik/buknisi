import { useQuery } from "@tanstack/react-query";
import { isInvalidRefreshTokenError, supabase } from "@/lib/supabase";

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            await supabase.auth.signOut({ scope: "local" });
          }
          throw error;
        }

        if (!user) throw new Error("No user");

        const { data: companyUser } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .single();

        if (!companyUser) throw new Error("No company found");

        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyUser.company_id)
          .single();

        return company;
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          await supabase.auth.signOut({ scope: "local" });
        }

        throw error;
      }
    },
  });
}
