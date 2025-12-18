"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({ isCollapsed }: { isCollapsed?: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={isCollapsed ? "w-full px-2" : "w-full justify-center"}
      onClick={handleLogout}
      disabled={isSubmitting}
      size={isCollapsed ? "icon" : "default"}
    >
      <LogOut className="h-4 w-4" />
      {!isCollapsed && <span className="ml-2">{isSubmitting ? "Odhlasujem..." : "Odhlásiť sa"}</span>}
    </Button>
  );
}
