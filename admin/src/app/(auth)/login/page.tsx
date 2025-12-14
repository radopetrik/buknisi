import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

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
        <LoginForm />
      </div>
    </div>
  );
}
