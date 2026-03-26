// src/server/favorites.ts
import { getSupabaseClient } from "@/lib/supabaseServer";
import type { ConsultantFavorite } from "@/types/workspaces";

export async function listUserFavorites(userId: string): Promise<string[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("consultant_favorites")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to load favorites: ${error.message}`);

  return ((data ?? []) as ConsultantFavorite[]).map((f) => f.consultant_id);
}

export async function toggleFavorite(
  userId: string,
  consultantId: string,
): Promise<{ favorited: boolean }> {
  const client = getSupabaseClient();

  // Check if already favorited
  const { data: existing } = await client
    .from("consultant_favorites")
    .select("*")
    .eq("user_id", userId)
    .eq("consultant_id", consultantId)
    .limit(1);

  const favorites = (existing ?? []) as ConsultantFavorite[];

  if (favorites.length > 0) {
    // Remove
    await client
      .from("consultant_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("consultant_id", consultantId);
    return { favorited: false };
  }

  // Add
  const { error } = await client
    .from("consultant_favorites")
    .insert({ user_id: userId, consultant_id: consultantId });

  if (error) throw new Error(`Failed to add favorite: ${error.message}`);
  return { favorited: true };
}
