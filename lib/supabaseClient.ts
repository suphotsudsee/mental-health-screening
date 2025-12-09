import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For demo purposes we throw early when env missing to avoid silent failures.
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("Supabase env vars are missing; client will not be initialized.");
}

export const supabaseBrowser = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
