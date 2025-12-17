"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserFooter } from "@/components/layout/user-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  companyName?: string | null;
}

export function AppShell({ children, userEmail, companyName }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "grid min-h-screen gap-6 px-4 py-6 transition-all duration-300 md:gap-8 md:px-8",
          isCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[260px_1fr]",
        )}
      >
        <aside className="relative rounded-3xl border border-white/20 bg-white/60 shadow-xl backdrop-blur-xl transition-all duration-300 md:sticky md:top-6 md:self-start md:h-[calc(100vh-3rem)]">
          <div className="absolute -right-3 top-8 z-20 hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border border-white/20 bg-white shadow-sm hover:bg-white/80"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-3 w-3" />
              ) : (
                <PanelLeftClose className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div
            className={cn(
              "flex h-full flex-col p-4 transition-all duration-300 md:overflow-y-auto",
              isCollapsed && "items-center px-2",
            )}
          >
            <div
              className={cn(
                "mb-6 flex items-center gap-3 px-1 transition-all duration-300",
                isCollapsed && "flex-col justify-center gap-0",
              )}
            >
              <div className="flex shrink-0 items-center justify-center">
                <Image
                  src="/logo_buknisi_hlava.png"
                  alt="Logo"
                  width={60}
                  height={60}
                  className={cn(
                    "object-contain transition-all duration-300",
                    isCollapsed ? "h-10 w-10" : "h-16 w-16",
                  )}
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden transition-all duration-300">
                  <h1 className="truncate text-sm font-bold text-foreground">
                    {companyName || "Buknisi Admin"}
                  </h1>
                  <p className="truncate text-xs font-medium text-muted-foreground/80">
                    Workspace
                  </p>
                </div>
              )}
            </div>
            <SidebarNav isCollapsed={isCollapsed} />
            <div className="mt-auto w-full pt-6">
              <UserFooter
                email={userEmail ?? "Signed in"}
                companyName={companyName ?? undefined}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        </aside>
        <main className="min-h-[70vh] rounded-3xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
