"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Trash2,
  Plus,
  Minus,
  Package,
  Tag,
  CreditCard,
  CheckCircle2,
  X,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CardsCoverflow from "./CardsCoverflow";

type Product = {
  id: string;
  sku: string;
  name: string;
  price_thb: number;
  category: "Singles" | "Booster" | "Accessories" | string;
  stock: number;
  image_url: string | null;
  set_name?: string | null;
  rarity?: string | null;
  condition?: string | null;
  foil?: boolean | null;
};

function money(n: number) {
  return n.toLocaleString("th-TH", { style: "currency", currency: "THB" });
}

export default function CardShopApp() {
  // สินค้าจากฐานข้อมูล
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ค้นหา & ฟิลเตอร์
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"ทั้งหมด" | Product["category"]>("ทั้งหมด");
  const [rarity, setRarity] = useState<"ทั้งหมด" | string>("ทั้งหมด");
  const [setFilter, setSetFilter] = useState<"ทั้งหมด" | string>("ทั้งหมด");
  const [foil, setFoil] = useState<"ทั้งหมด" | "Foil" | "Non-Foil">("ทั้งหมด");

  // โหมดแสดง “ขนาดจริง 61×89 มม.” (สำหรับเทียบการ์ดจริง)
  const [realSize, setRealSize] = useState(false);

  // ตะกร้า & เช็คเอาต์
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({}); // productId -> qty

  // ฟอร์มเช็คเอาต์
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"promptpay" | "bank" | "cod">(
    "promptpay"
  );

  // ร้าน/ชำระเงิน
  const promptpayId = "0812345678"; // <- แก้เป็นของคุณ
  const lineLinkBase = "https://line.me/R/msg/text/?";

  // โหลดสินค้าจากฐานข้อมูล
  useEffect(() => {
    (async () => {
      try {
        setLoadingProd(true);
        setLoadError(null);
        const r = await fetch("/api/products", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "โหลดสินค้าไม่สำเร็จ");
        const list: Product[] = (j.products || []).map((p: any) => ({
          id: p.id,
          sku: p.sku ?? "",
          name: p.name ?? "",
          price_thb: p.price_thb ?? 0,
          category: p.category ?? "Singles",
          stock: p.stock ?? 0,
          image_url: p.image_url ?? "",
          set_name: p.set_name ?? p.setName ?? p.set ?? p.series ?? "-",
          rarity: p.rarity ?? "Common",
          condition: p.condition ?? "NM",
          foil: !!p.foil,
        }));
        setProducts(list);
      } catch (e: any) {
        setLoadError(e?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoadingProd(false);
      }
    })();
  }, []);

  // ตัวเลือกฟิลเตอร์
  const categories = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );
  const rarities = useMemo(
    () => [
      "ทั้งหมด",
      ...Array.from(new Set(products.map((p) => p.rarity ?? "Common"))),
    ],
    [products]
  );
  const sets = useMemo(
    () => [
      "ทั้งหมด",
      ...Array.from(new Set(products.map((p) => p.set_name ?? "-"))),
    ],
    [products]
  );

  // กรองสินค้า
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const okCat = cat === "ทั้งหมด" || p.category === cat;
      const okRarity =
        rarity === "ทั้งหมด" || (p.rarity ?? "").toString() === rarity;
      const okSet = setFilter === "ทั้งหมด" || (p.set_name ?? "") === setFilter;
      const okFoil =
        foil === "ทั้งหมด" ||
        (foil === "Foil" && !!p.foil) ||
        (foil === "Non-Foil" && !p.foil);
      const okQuery =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.set_name ?? "").toLowerCase().includes(q);
      return okCat && okRarity && okSet && okFoil && okQuery;
    });
  }, [products, query, cat, rarity, setFilter, foil]);

  // ตะกร้า
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([pid, qty]) => {
      const p = products.find((x) => x.id === pid)!;
      return { ...p, qty };
    });
  }, [cart, products]);

  const subtotal = useMemo(
    () => cartItems.reduce((s, i: any) => s + (i.price_thb || 0) * i.qty, 0),
    [cartItems]
  );
  const shipping = subtotal > 1000 ? 0 : subtotal === 0 ? 0 : 50;
  const total = subtotal + shipping;

  // ฟังก์ชันตะกร้า
  function addToCart(id: string) {
    setCart((prev) => {
      const nextQty = (prev[id] || 0) + 1;
      const stock = products.find((p) => p.id === id)?.stock ?? 0;
      return { ...prev, [id]: Math.min(nextQty, stock) };
    });
    setCartOpen(true);
  }
  function setQty(id: string, qty: number) {
    const stock = products.find((p) => p.id === id)?.stock ?? 0;
    setCart((prev) => ({ ...prev, [id]: Math.max(1, Math.min(qty, stock)) }));
  }
  function inc(id: string) {
    setQty(id, (cart[id] || 0) + 1);
  }
  function dec(id: string) {
    setQty(id, (cart[id] || 0) - 1);
  }
  function removeItem(id: string) {
    setCart((prev) => {
      const cp = { ...prev };
      delete cp[id];
      return cp;
    });
  }
  function clearCart() {
    setCart({});
  }

  // ชำระเงิน/สรุปคำสั่งซื้อ: ยิง POST /api/orders ก่อน แล้วค่อยเปิด LINE
  async function placeOrder() {
    if (cartItems.length === 0) return;

    try {
      const items = cartItems.map((i: any) => ({
        product_id: i.id,
        qty: i.qty,
      }));
      const payload = {
        full_name: name,
        phone,
        address,
        payment_method: payment,
        shipping_thb: shipping,
        items,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "สั่งซื้อไม่สำเร็จ");
        return;
      }

      const orderId = json.order_id as string;

      const orderLines = cartItems
        .map(
          (i: any) =>
            `• ${i.name} (${i.set_name ?? "-"}${i.foil ? ", Foil" : ""}, ${
              i.rarity ?? "Common"
            }, ${i.condition ?? "NM"}) x${i.qty} = ${money(
              (i.price_thb || 0) * i.qty
            )}`
        )
        .join("\n");

      const text = `🃏 คำสั่งซื้อใหม่ (TCG Shop)\n\nรหัสออเดอร์: ${orderId}\nลูกค้า: ${
        name || "-"
      }\nโทร: ${phone || "-"}\nที่อยู่: ${
        address || "รับเอง/นัดรับ"
      }\n\nรายการสินค้า\n${orderLines}\n\nค่าสินค้า: ${money(
        subtotal
      )}\nค่าส่ง: ${money(shipping)}\nยอดรวม: ${money(total)}\nชำระ: ${
        payment === "promptpay"
          ? `PromptPay (${promptpayId})`
          : payment === "cod"
          ? "เก็บเงินปลายทาง"
          : "โอนบัญชีธนาคาร"
      }\n\nวันที่: ${new Date().toLocaleString("th-TH")}\n`;

      const encoded = encodeURIComponent(text);
      window.open(`${lineLinkBase}${encoded}`, "_blank");

      setCheckoutOpen(false);
      clearCart();
    } catch (e: any) {
      alert(e?.message || "เกิดข้อผิดพลาด");
    }
  }

  // Badge ความหายาก
  function RarityBadge({ rarity }: { rarity: string | null | undefined }) {
    const r = rarity ?? "Common";
    const styleMap: Record<string, string> = {
      Common: "bg-gray-200 text-gray-800",
      Uncommon: "bg-emerald-200 text-emerald-900",
      Rare: "bg-blue-200 text-blue-900",
      "Super Rare": "bg-purple-200 text-purple-900",
      "Ultra Rare": "bg-rose-200 text-rose-900",
      "Secret Rare": "bg-yellow-200 text-yellow-900",
      Mythic: "bg-orange-200 text-orange-900",
    };
    return (
      <Badge className={`rounded-full ${styleMap[r] || styleMap.Common}`}>
        {r}
      </Badge>
    );
  }

  // กล่องภาพการ์ด (โหมดปกติ = aspect 61/89, โหมดขนาดจริง = 61×89 มม.)
  const cardImageWrapClass = realSize
    ? "relative w-[61mm] h-[89mm] mx-auto"
    : "relative aspect-[61/89] w-full";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur bg-slate-900/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-400" />
            <div className="text-xl font-semibold tracking-wide">Vanguard</div>
            <Badge className="ml-1 rounded-full bg-amber-400 text-slate-900">
              การ์ดเกม
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-2 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา: ชื่อการ์ด / รหัสการ์ด"
                className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <Select value={cat} onValueChange={(v: any) => setCat(v)}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-slate-100">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c as any}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ปุ่มโหมดขนาดจริง */}
            {/* <Button
              variant="outline"
              className="border-white/30 text-slate-100"
              onClick={() => setRealSize((v) => !v)}
              title="พรีวิวการ์ดขนาดจริง 61×89 มม."
            >
              {realSize ? "ปิดโหมดขนาดจริง" : "โหมดขนาดจริง"}
            </Button> */}

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-amber-400 text-slate-900 hover:bg-amber-300"
                >
                  <ShoppingCart className="w-4 h-4" />
                  ตะกร้า ({cartItems.reduce((s, i) => s + i.qty, 0)})
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>ตะกร้าสินค้า</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                  {cartItems.length === 0 && (
                    <div className="text-sm text-slate-500">
                      ยังไม่มีสินค้าในตะกร้า
                    </div>
                  )}

                  {cartItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-slate-100 rounded-2xl text-slate-900"
                    >
                      {/* รูปย่อ 61:89 */}
                      <div className="relative w-16 aspect-[61/89] shrink-0">
                        <img
                          src={item.image_url || ""}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {item.set_name ?? "-"} • {item.condition ?? "NM"}{" "}
                          {item.foil ? "• Foil" : ""}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => dec(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            value={item.qty}
                            onChange={(e) =>
                              setQty(item.id, Number(e.target.value) || 1)
                            }
                            className="w-14 text-center"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => inc(item.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {money((item.price_thb || 0) * item.qty)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>ค่าสินค้า</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่าส่ง (ฟรีเมื่อ &gt; 1,000)</span>
                    <span>{money(shipping)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>ยอดรวม</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={clearCart}>
                    ล้างตะกร้า
                  </Button>

                  <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={cartItems.length === 0}
                        className="gap-2"
                      >
                        <CreditCard className="w-4 h-4" /> ชำระเงิน
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[640px]">
                      <DialogHeader>
                        <DialogTitle>สรุปคำสั่งซื้อ & ชำระเงิน</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <Label>ชื่อ-นามสกุล</Label>
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="เช่น สมชาย นักสะสม"
                            />
                          </div>
                          <div>
                            <Label>เบอร์โทร</Label>
                            <Input
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="0xxxxxxxxx"
                            />
                          </div>
                          <div>
                            <Label>ที่อยู่จัดส่ง (ถ้ามี)</Label>
                            <Input
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="บ้านเลขที่/ซอย/เขต/จังหวัด/รหัสไปรษณีย์"
                            />
                          </div>
                          <div>
                            <Label>วิธีชำระเงิน</Label>
                            <Select
                              value={payment}
                              onValueChange={(v: any) => setPayment(v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="promptpay">
                                  PromptPay
                                </SelectItem>
                                <SelectItem value="bank">
                                  โอนบัญชีธนาคาร
                                </SelectItem>
                                <SelectItem value="cod">
                                  เก็บเงินปลายทาง
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl p-3 bg-slate-100 text-slate-900">
                            <div className="font-medium mb-2 flex items-center gap-2">
                              <Tag className="w-4 h-4" /> รายการสินค้า
                            </div>
                            <div className="space-y-1 text-sm max-h-44 overflow-auto pr-2">
                              {cartItems.map((i: any) => (
                                <div
                                  key={i.id}
                                  className="flex justify-between"
                                >
                                  <span className="truncate mr-2">
                                    {i.name} ({i.set_name ?? "-"}
                                    {i.foil ? ", Foil" : ""},{" "}
                                    {i.rarity ?? "Common"},{" "}
                                    {i.condition ?? "NM"}) x{i.qty}
                                  </span>
                                  <span className="font-semibold">
                                    {money((i.price_thb || 0) * i.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 border-t pt-2 text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>ค่าสินค้า</span>
                                <span>{money(subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>ค่าส่ง</span>
                                <span>{money(shipping)}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>รวมสุทธิ</span>
                                <span>{money(total)}</span>
                              </div>
                            </div>
                          </div>

                          {payment === "promptpay" && (
                            <div className="rounded-2xl p-3 bg-white border text-slate-900">
                              <div className="font-medium mb-1">
                                สแกนจ่าย PromptPay
                              </div>
                              <div className="text-sm text-slate-600 mb-2">
                                พร้อมเพย์:{" "}
                                <span className="font-semibold">
                                  {promptpayId}
                                </span>{" "}
                                (แก้ในโค้ด)
                              </div>
                              <div className="aspect-square w-full rounded-xl bg-slate-200 grid place-items-center">
                                <div className="text-xs text-slate-600">
                                  ใส่รูป QR ของคุณที่นี่
                                </div>
                              </div>
                            </div>
                          )}

                          {payment === "bank" && (
                            <div className="rounded-2xl p-3 bg-white border text-sm text-slate-900">
                              <div className="font-medium mb-1">
                                โอนบัญชีธนาคาร
                              </div>
                              <div>
                                กสิกร 012-3-45678-9 ชื่อบัญชี: ตัวอย่าง
                                ทีซีจีช็อป (แก้ในโค้ด)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCheckoutOpen(false)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          ยกเลิก
                        </Button>
                        <Button
                          onClick={placeOrder}
                          className="gap-2 bg-amber-400 text-slate-900 hover:bg-amber-300"
                        >
                          <CheckCircle2 className="w-4 h-4" /> ส่งออเดอร์ผ่าน
                          LINE
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          {/* ซ้าย: ข้อความ */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              ค้นหา{" "}
              <span className="text-amber-400 drop-shadow-lg">การ์ดเกม</span>{" "}
              เพื่อดูความสามารถของมันได้เลย
            </h1>
            <p className="text-slate-300 text-lg">
              สำรวจคลังการ์ดทั้งหมดของคุณได้ในที่เดียว ค้นหาชื่อการ์ด รหัส
              หรือดูรายละเอียดความสามารถได้อย่างรวดเร็ว
            </p>

            <div className="pt-4">
              <a
                href="#cards"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-2xl shadow-md transition-all duration-300 hover:scale-105"
              >
                🔍 เริ่มค้นหาเลย
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <CardsCoverflow />
          </div>
        </div>
      </section>

      {/* Filters row */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">หมวด</Label>
            <Select value={cat} onValueChange={(v: any) => setCat(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c as any}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">เซ็ต</Label>
            <Select
              value={setFilter}
              onValueChange={(v: any) => setSetFilter(v)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {sets.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">ความหายาก</Label>
            <Select value={rarity} onValueChange={(v: any) => setRarity(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {rarities.map((r: any) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">Foil</Label>
            <Select value={foil} onValueChange={(v: any) => setFoil(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                <SelectItem value="Foil">Foil</SelectItem>
                <SelectItem value="Non-Foil">Non-Foil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main id="catalog" className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingProd && (
            <div className="col-span-full text-slate-300">กำลังโหลดสินค้า…</div>
          )}
          {loadError && (
            <div className="col-span-full text-red-300">
              โหลดสินค้าไม่สำเร็จ: {loadError}
            </div>
          )}

          {!loadingProd &&
            !loadError &&
            filtered.map((p) => (
              <Card
                key={p.id}
                className="rounded-3xl overflow-hidden bg-slate-800/70 border-white/10 hover:shadow-2xl hover:shadow-amber-400/10 transition"
              >
                <CardHeader className="p-0 relative">
                  {/* ภาพสินค้า — คงอัตราส่วน 61:89 หรือขนาดจริง 61×89 มม. */}
                  <div className={cardImageWrapClass}>
                    <img
                      src={p.image_url || ""}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  {!!p.foil && (
                    <div className="absolute top-3 right-3">
                      <Badge className="rounded-full bg-gradient-to-r from-yellow-200 to-amber-400 text-slate-900 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Foil
                      </Badge>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4">
                  <CardTitle className="text-base line-clamp-2">
                    {p.name}
                  </CardTitle>

                  <div className="mt-1 text-xs text-slate-300">
                    {p.set_name ?? "-"} • {p.condition ?? "NM"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <RarityBadge rarity={p.rarity} />
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-700 text-slate-100"
                    >
                      {p.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-700 text-slate-100"
                    >
                      SKU: {p.sku}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-lg font-semibold text-amber-300">
                      {money(p.price_thb || 0)}
                    </div>
                    <div className="text-xs text-slate-300">
                      สต็อก: {p.stock}
                    </div>
                  </div>

                  <Button
                    className="mt-3 w-full rounded-2xl bg-amber-400 text-slate-900 hover:bg-amber-300"
                    onClick={() => addToCart(p.id)}
                    disabled={(p.stock ?? 0) <= 0}
                  >
                    เพิ่มลงตะกร้า
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-6 pb-10 text-sm text-slate-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              © {new Date().getFullYear()} TCG Vault — ทำโดยคุณ • ติดต่อ LINE:
              @yourlineid (แก้ในโค้ด)
            </div>
            <div className="flex gap-4">
              <span>เงื่อนไขการคืนสินค้า</span>
              <span>วิธีสั่งซื้อ</span>
              <span>ติดต่อเรา</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
