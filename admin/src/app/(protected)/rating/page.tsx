import { RatingManager } from "./_components/rating-manager";
import { getRatings } from "./actions";

export default async function RatingPage() {
  const { ratings, stats } = await getRatings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hodnotenia</h1>
          <p className="text-muted-foreground">
            Prehľad a správa hodnotení od zákazníkov.
          </p>
        </div>
      </div>
      <RatingManager initialRatings={ratings} stats={stats} />
    </div>
  );
}
