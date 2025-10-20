// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!, // ใช้เฉพาะฝั่ง server
  { auth: { persistSession: false, autoRefreshToken: false } }
);
