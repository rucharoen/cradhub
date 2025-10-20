// app/api/products/route.ts
import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase-client";

export async function GET() {
  // เลือกเฉพาะคอลัมน์พื้นฐานที่มักมีจริง
  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      id,
      sku,
      name,
      price_thb,
      category,
      stock,
      image_url,
      is_active,
      created_at
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // เติมค่า default ให้ฟิลด์เฉพาะทาง TCG ที่ฐานข้อมูลคุณยังไม่มี
  const mapped = (data ?? []).map((p: any) => ({
    id: p.id,
    sku: p.sku ?? "",
    name: p.name ?? "",
    price_thb: p.price_thb ?? 0,
    category: p.category ?? "Singles",
    stock: p.stock ?? 0,
    image_url: p.image_url ?? "",
    // ฟิลด์ TCG ที่ยังไม่มีใน DB → ใส่ค่าเริ่มต้นไว้ก่อน
    set_name: "-",                 // ถ้ายังไม่มีคอลัมน์ set_name
    rarity: "Common",              // ยังไม่มีคอลัมน์ rarity
    condition: "NM",               // ยังไม่มีคอลัมน์ condition
    foil: false,                   // ยังไม่มีคอลัมน์ foil (boolean)
    is_active: !!p.is_active,
  }));

  return NextResponse.json({ products: mapped });
}
