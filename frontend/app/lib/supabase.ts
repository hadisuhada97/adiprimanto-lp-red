import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Fall back to placeholder values so createClient doesn't throw when env vars are unset.
export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder");
