import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

interface UserWithCompanyResult {
  user: User | null;
  company: { id: string; name: string } | null;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have proxy refreshing user sessions.
          }
        },
      },
    },
  );
}

export async function getUserWithCompany(): Promise<UserWithCompanyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, company: null };
  }

  const { data: companyRelation, error: companyError } = await supabase
    .from("company_users")
    .select("company:companies(id, name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (companyError) {
    throw companyError;
  }

  const company = companyRelation?.company;
  const companyData = Array.isArray(company) ? company[0] : company;

  return {
    user,
    company: companyData ?? null,
  };
}
