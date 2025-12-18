import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";

interface Sale {
  id: string;
  name: string;
  email: string;
  amount: number;
  date: string; // ISO date
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Žiadne nedávne transakcie.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${sale.email}`} alt="Avatar" />
            <AvatarFallback>{sale.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">
              {sale.email || "Bez emailu"}
            </p>
          </div>
          <div className="ml-auto font-medium">+{formatPrice(sale.amount)}</div>
        </div>
      ))}
    </div>
  );
}
