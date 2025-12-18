import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/auth/logout-button";

interface UserFooterProps {
  email: string;
  companyName?: string;
  isCollapsed?: boolean;
}

export function UserFooter({ email, companyName, isCollapsed }: UserFooterProps) {
  const initials = email
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-3 rounded-xl border border-white/20 bg-white/30 p-3 shadow-sm backdrop-blur-sm transition-all duration-300">
      <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
        <Avatar>
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
            <p className="truncate text-sm font-medium text-foreground" title={companyName ?? "Prihlásený"}>
              {companyName ?? "Prihlásený"}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={email}>
              {email}
            </p>
          </div>
        )}
      </div>
      <Separator />
      <LogoutButton isCollapsed={isCollapsed} />
    </div>
  );
}
