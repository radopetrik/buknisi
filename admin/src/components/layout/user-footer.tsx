import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/auth/logout-button";

interface UserFooterProps {
  email: string;
  companyName?: string;
}

export function UserFooter({ email, companyName }: UserFooterProps) {
  const initials = email
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/50 p-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={companyName ?? "Logged in"}>
            {companyName ?? "Logged in"}
          </p>
          <p className="truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
        </div>
      </div>
      <Separator />
      <LogoutButton />
    </div>
  );
}
