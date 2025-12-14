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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface LoginFormProps {
  initialError?: string | null;
}

export function LoginForm({ initialError }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "no_company") {
      setError("Your account is missing a company association.");
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
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    const signedInUser = data.user ?? (await supabase.auth.getUser()).data.user;

    if (!signedInUser) {
      setError("Unable to complete sign in.");
      setIsSubmitting(false);
      return;
    }

    const { data: companyRelation, error: companyError } = await supabase
      .from("company_users")
      .select("company:companies(name)")
      .eq("user_id", signedInUser.id)
      .maybeSingle();

    if (companyError) {
      setError("Unable to verify company access.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    if (!companyRelation?.company) {
      setError("Your account is missing a company association.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-foreground">
          Sign in
        </CardTitle>
        <CardDescription>
          Access your admin workspace with your email and password.
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
                    <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormDescription>Use your work email to sign in.</FormDescription>
                  <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">
          <p className="font-medium">Welcome back!</p>
          <p className="text-purple-800/80">
            Keep your credentials secure. You can sign out anytime from the sidebar footer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
