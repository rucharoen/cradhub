// app/api/cards/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// เปลี่ยนชื่อ table/bucket ได้ผ่าน .env.local
// NEXT_PUBLIC_SUPABASE_TABLE_PRODUCTS=products
// NEXT_PUBLIC_SUPABASE_BUCKET_IMAGES=cards  (หรือชื่อ bucket ที่เก็บรูป)
const TABLE  = process.env.NEXT_PUBLIC_SUPABASE_TABLE_PRODUCTS || "products";
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_IMAGES || "cards";
const SIGNED_SECONDS = Number(process.env.SUPABASE_SIGNED_URL_SECONDS || "0"); // 0 = public

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient();

    // รองรับค้นหา ?q=
    const urlObj = new URL(req.url);
    const q = (urlObj.searchParams.get("q") || "").trim();

    // ดึงจาก "products" (ตารางที่คุณใช้ได้อยู่แล้ว)
    let query = supabase.from(TABLE).select("*").order("id", { ascending: true });
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,sku.ilike.%${q}%,set_name.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message, table: TABLE },
        { status: 500 }
      );
    }

    // helper: แปลง path → object path ใน bucket
    const toObjectPath = (p?: string | null) => {
      if (!p) return null;
      let path = p.replace(/^public\//, "");
      if (path.startsWith(`${BUCKET}/`)) path = path.slice(BUCKET.length + 1);
      return path; // path ภายใน bucket
    };

    // map ผลลัพธ์เป็นรูปแบบ "การ์ด"
    const cards = await Promise.all(
      (data || []).map(async (p: any) => {
        // 1) ลำดับความสำคัญของรูป: image_url (เต็ม) > imagePath ใน storage
        let img: string | null = p.image_url ?? p.img ?? null;

        const imagePath =
          p.image_path ?? p.storage_path ?? p.img_path ?? null;

        if (!img && imagePath) {
          const objectPath = toObjectPath(imagePath);
          if (objectPath) {
            if (SIGNED_SECONDS > 0) {
              const { data: signed } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(objectPath, SIGNED_SECONDS);
              img = signed?.signedUrl ?? null;
            } else {
              const { data: pub } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(objectPath);
              img = pub.publicUrl || null;
            }
          }
        }

        return {
          // ฟิลด์การ์ดที่หน้า UI ใช้
          id: p.id,
          code: p.code ?? p.sku ?? null,
          name: p.name ?? "",
          image_url: img,
          set_name: p.set_name ?? p.set ?? p.series ?? null,
          rarity: p.rarity ?? null,
          type_line: p.type_line ?? p.type ?? null,
          grade: p.grade ?? null,
          power: p.power ?? null,
          shield: p.shield ?? null,
          ability_text: p.ability_text ?? p.text ?? p.ability ?? null,
        };
      })
    );

    return NextResponse.json({ ok: true, count: cards.length, cards }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error at /api/cards" },
      { status: 500 }
    );
  }
}
