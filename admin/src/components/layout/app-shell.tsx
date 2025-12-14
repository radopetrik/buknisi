import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserFooter } from "@/components/layout/user-footer";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <div className="grid min-h-screen gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:gap-8 md:px-8">
        <aside className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex h-full flex-col p-4">
            <div className="mb-6 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700">
                Control Center
              </p>
              <h1 className="text-xl font-semibold text-foreground">Admin</h1>
              <p className="text-sm text-muted-foreground">Navigate your workspace</p>
            </div>
            <SidebarNav />
            <div className="mt-auto pt-6">
              <UserFooter email={userEmail ?? "Signed in"} />
            </div>
          </div>
        </aside>
        <main className="min-h-[70vh] rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
