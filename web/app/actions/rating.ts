'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCompanyRating(companyId: string, rating: number, note: string, path: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Musíte byť prihlásený." };
  }

  if (rating < 1 || rating > 5) {
      return { error: "Hodnotenie musí byť od 1 do 5." };
  }

  const { error } = await supabase
    .from("company_ratings")
    .insert({
      company_id: companyId,
      user_id: user.id,
      rating,
      note,
    });

  if (error) {
    if (error.code === '23505') { // Unique violation
        return { error: "Túto firmu ste už hodnotili." };
    }
    console.error("Error adding rating:", error);
    return { error: "Nepodarilo sa pridať hodnotenie." };
  }

  revalidatePath(path);
  return { success: true };
}
