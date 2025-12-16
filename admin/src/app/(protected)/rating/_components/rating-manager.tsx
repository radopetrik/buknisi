"use client";

import { useState } from "react";
import { Star, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { deleteRating } from "../actions";
import { Rating, RatingStats } from "../types";

interface RatingManagerProps {
  initialRatings: Rating[];
  stats: RatingStats;
}

export function RatingManager({ initialRatings, stats }: RatingManagerProps) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();
  // We'll fallback to alert if useToast isn't available, but let's try to find it or just use simple alert for now if unsure.
  // Actually, I should check if use-toast exists. But standard shadcn has it. I'll assume it might not be there or is in components/ui/use-toast.
  // To be safe, I'll just use window.alert or basic console for error/success if I can't verify the hook quickly. 
  // Wait, the file list didn't show hooks/use-toast. It showed 'components/ui/...'.
  // I will skip the toast hook to avoid import errors and just use local state for loading.

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const result = await deleteRating(id);

      if (result.success) {
        setRatings((prev) => prev.filter((r) => r.id !== id));
        router.refresh(); // Refresh server stats
      } else {
        alert(result.message || "Chyba pri mazaní");
      }
    } catch (error) {
      alert("Nastala chyba");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové hodnotenie</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.average).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              z {stats.count} hodnotení
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Zoznam hodnotení</h2>
        
        {ratings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Zatiaľ žiadne hodnotenia.
          </div>
        ) : (
          <div className="grid gap-4">
            {ratings.map((rating) => (
              <Card key={rating.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {rating.profiles?.first_name?.[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium leading-none">
                            {rating.profiles?.first_name 
                              ? `${rating.profiles.first_name} ${rating.profiles.last_name || ''}`
                              : "Neznámy používateľ"}
                          </p>
                          <span className="text-sm text-muted-foreground">
                            • {new Date(rating.created_at).toLocaleDateString("sk-SK")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {rating.note && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {rating.note}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Zmazať hodnotenie?</DialogTitle>
                          <DialogDescription>
                            Táto akcia je nevratná. Hodnotenie bude natrvalo odstránené.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(rating.id)}
                            disabled={isDeleting === rating.id}
                          >
                            {isDeleting === rating.id ? "Mazanie..." : "Zmazať"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
