// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_KEY ?? // กันพิมพ์ชื่อต่าง
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // สำรองสุดท้าย

if (!url) throw new Error("SUPABASE_URL is required");
if (!key) throw new Error("supabaseKey is required"); // ตรงกับข้อความที่คุณเจอ

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
});
