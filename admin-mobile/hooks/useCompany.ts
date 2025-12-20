import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    },
  });
}
