import Image from "next/image";
import { redirect } from "next/navigation";
import { CSSProperties } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { createClient, getUserWithCompany } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { user, company } = await getUserWithCompany();

  if (user && company) {
    redirect("/");
  }

  if (user && !company) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const errorParam = Array.isArray(params?.error) ? params.error[0] : params?.error;

  const initialError =
    user && !company
      ? "Your account is missing a company association."
      : errorParam === "no_company"
        ? "Your account is missing a company association."
        : null;

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* Left Side - Image Background */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
             {/* Optional small logo in corner if needed, leaving empty for now */}
          </div>
          <div>
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Krása začína v okamihu, keď sa rozhodnete byť sami sebou. Ale dokonalá manikúra tomu určite pomôže.&rdquo;
              </p>
              <footer className="text-sm text-white/80">Buknisi Admin</footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col justify-center bg-background px-4 lg:w-1/2 lg:px-8">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="relative mb-4 h-16 w-48">
              <Image
                src="/logo_buknisi_hlava.png"
                alt="Buknisi Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Vitajte späť
            </h1>
            <p className="text-sm text-muted-foreground">
              Zadajte svoje údaje pre vstup do administrácie
            </p>
          </div>
          
          <LoginForm 
            initialError={initialError} 
            className="border-none shadow-none"
          />
          
          <div className="px-8 text-center text-sm text-muted-foreground">
             &copy; {new Date().getFullYear()} Buknisi. Všetky práva vyhradené.
          </div>
        </div>
      </div>
    </div>
  );
}
