// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

type OrderItem = { product_id: string; qty: number };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      full_name = null,
      phone = null,
      address = null,
      payment_method = "promptpay", // 'promptpay' | 'bank' | 'cod'
      shipping_thb = 50,
      items,
    }: {
      full_name?: string | null;
      phone?: string | null;
      address?: string | null;
      payment_method?: "promptpay" | "bank" | "cod";
      shipping_thb?: number;
      items: OrderItem[];
    } = body || {};

    // ตรวจ payload ขั้นพื้นฐาน
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }
    if (items.some((it) => !it.product_id || !it.qty || it.qty <= 0)) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    // เรียกฟังก์ชัน RPC ใน Postgres (atomic transaction)
    const { data, error } = await supabaseAdmin.rpc("place_order_and_decrement_stock", {
      p_full_name: full_name,
      p_phone: phone,
      p_address: address,
      p_payment_method: payment_method,
      p_shipping_thb: shipping_thb,
      p_items: items, // jsonb array: [{ product_id, qty }]
    });

    if (error) {
      // บอกสาเหตุที่พบบ่อยให้เดาง่ายขึ้น
      const hint =
        error.message.includes("function place_order_and_decrement_stock") ||
        error.message.includes("does not exist")
          ? "RPC ยังไม่ได้สร้างในฐานข้อมูล ให้รัน SQL สร้างฟังก์ชันก่อน"
          : undefined;
      return NextResponse.json({ error: error.message, hint }, { status: 400 });
    }

    // data คือ order_id (uuid) ที่ RPC คืนมา
    return NextResponse.json({ order_id: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


export async function GET() {
  return new NextResponse(
    JSON.stringify({
      ok: false,
      message: "Use POST /api/orders with JSON body.",
      example: {
        full_name: "ชื่อลูกค้า",
        phone: "เบอร์",
        address: "ที่อยู่",
        payment_method: "promptpay | bank | cod",
        shipping_thb: 50,
        items: [{ product_id: "uuid", qty: 1 }]
      }
    }),
    { status: 405, headers: { "content-type": "application/json; charset=utf-8", allow: "POST" } }
  );
}
