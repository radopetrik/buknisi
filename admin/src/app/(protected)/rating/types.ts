export interface Rating {
  id: string;
  rating: number;
  note: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export interface RatingStats {
  average: number;
  count: number;
}
