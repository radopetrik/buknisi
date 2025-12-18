"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Zadajte platný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
});

interface LoginFormProps {
  initialError?: string | null;
  className?: string;
}

export function LoginForm({ initialError, className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "no_company") {
      setError("Vášmu účtu chýba priradenie k spoločnosti.");
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError(null);
    setIsSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(values);

    if (signInError) {
      // Basic translation for common Supabase errors
      let msg = signInError.message;
      if (msg === "Invalid login credentials") {
        msg = "Neplatné prihlasovacie údaje.";
      } else if (msg === "Email not confirmed") {
        msg = "Email nebol potvrdený.";
      }
      setError(msg);
      setIsSubmitting(false);
      return;
    }

    const signedInUser = data.user ?? (await supabase.auth.getUser()).data.user;

    if (!signedInUser) {
      setError("Nepodarilo sa dokončiť prihlásenie.");
      setIsSubmitting(false);
      return;
    }

    const { data: companyRelation, error: companyError } = await supabase
      .from("company_users")
      .select("company:companies(name)")
      .eq("user_id", signedInUser.id)
      .maybeSingle();

    if (companyError) {
      setError("Nepodarilo sa overiť prístup k spoločnosti.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    if (!companyRelation?.company) {
      setError("Vášmu účtu chýba priradenie k spoločnosti.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <Card className={cn("w-full max-w-md border-border/80 shadow-lg", className)}>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-foreground">
          Prihlásenie
        </CardTitle>
        <CardDescription>
          Vstúpte do svojho admin prostredia pomocou emailu a hesla.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="vy@priklad.com" type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormDescription>Na prihlásenie použite svoj pracovný email.</FormDescription>
                  <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.password?.message}</FormMessage>
                </FormItem>
              )}
            />
            {error ? (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Prihlasujem..." : "Prihlásiť sa"}
            </Button>
          </form>
        </Form>
        <div className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          <p className="font-medium">Vitajte späť!</p>
          <p className="text-secondary-foreground/80">
            Udržujte svoje prihlasovacie údaje v bezpečí. Odhlásiť sa môžete kedykoľvek v pätičke bočného panela.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
