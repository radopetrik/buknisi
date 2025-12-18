"use client";

import { UnpaidBooking } from "../types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "../utils";
import { CreditCard } from "lucide-react";

interface UnpaidListProps {
  bookings: UnpaidBooking[];
  onPay: (booking: UnpaidBooking) => void;
}

export function UnpaidList({ bookings, onPay }: UnpaidListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Žiadne nezaplatené rezervácie.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Dátum</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Čas</TableHead>
              <TableHead>Suma</TableHead>
              <TableHead className="text-right pr-4">Akcia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium pl-4">
                  {formatDate(booking.date)}
                </TableCell>
                <TableCell>
                  {booking.clientName || "Neznámy klient"}
                </TableCell>
                <TableCell>
                  {booking.timeFrom.slice(0, 5)} - {booking.timeTo.slice(0, 5)}
                </TableCell>
                <TableCell>
                  {formatPrice(booking.totalPrice)}
                </TableCell>
                <TableCell className="text-right pr-4">
                  <Button size="sm" onClick={() => onPay(booking)} className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Zaplatiť
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
