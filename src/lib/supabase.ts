import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Null sem as variáveis de ambiente: o app cai no modo local (localStorage, login por username). */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
