import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://afqycxwuvzmksompycco.supabase.co";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Falta EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo .env");
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
