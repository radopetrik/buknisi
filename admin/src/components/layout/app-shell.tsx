import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserFooter } from "@/components/layout/user-footer";
import Image from "next/image";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  companyName?: string | null;
}

export function AppShell({ children, userEmail, companyName }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:gap-8 md:px-8">
        <aside className="rounded-3xl border border-white/20 bg-white/60 shadow-xl backdrop-blur-xl md:sticky md:top-6 md:self-start md:h-[calc(100vh-3rem)]">
          <div className="flex h-full flex-col p-4 md:overflow-y-auto">
            <div className="mb-6 flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50 shadow-sm ring-1 ring-black/5">
                <Image
                  src="/logo_buknisi.png"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h1 className="truncate text-sm font-bold text-foreground">
                  {companyName || "Buknisi Admin"}
                </h1>
                <p className="truncate text-xs font-medium text-muted-foreground/80">
                  Workspace
                </p>
              </div>
            </div>
            <SidebarNav />
            <div className="mt-auto pt-6">
              <UserFooter email={userEmail ?? "Signed in"} companyName={companyName ?? undefined} />
            </div>
          </div>
        </aside>
        <main className="min-h-[70vh] rounded-3xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
