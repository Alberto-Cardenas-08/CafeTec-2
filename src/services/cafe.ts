import { getSupabase, isSupabaseConfigured } from "@/services/supabase";

export { isSupabaseConfigured };

export async function getCafeOpen() {
  if (!isSupabaseConfigured()) return true;
  const { data, error } = await getSupabase()
    .from("cafe_settings")
    .select("is_open")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return true;
  return Boolean(data.is_open);
}
