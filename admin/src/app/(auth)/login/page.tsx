import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createClient, getUserWithCompany } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user, company } = await getUserWithCompany();

  if (user && company) {
    redirect("/");
  }

  if (user && !company) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const initialError =
    user && !company
      ? "Your account is missing a company association."
      : searchParams?.error === "no_company"
        ? "Your account is missing a company association."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-slate-50 px-4 py-12">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-700">
            Admin Access
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to continue to your admin workspace.
          </p>
        </div>
        <LoginForm initialError={initialError} />
      </div>
    </div>
  );
}
