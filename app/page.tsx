"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Package,
  Star,
  Copy,
  Layers,
  Sparkles,
  Swords,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// ————————————————— TYPES ————————————————
export type TcgCard = {
  id: string;
  code?: string | null;
  name: string;
  image_url: string | null;
  set_name?: string | null;
  rarity?: string | null;
  type_line?: string | null;
  grade?: string | number | null;
  power?: number | null;
  shield?: number | null;
  nation?: string | null;
  clan?: string | null;
  attribute?: string | null;
  ability_text?: string | null;
};

type Tier = "S" | "A" | "B" | "C";

// ⭐ ใส่เด็คจริงของคุณตรงนี้
const TIER_LIST: Record<Tier, { deck: string; notes?: string }[]> = {
  S: [
    { deck: "Lyrical: Heartfelt Song, Loronerol", notes: "คุมเกมแรง สเงิลยืดหยุ่น" },
    { deck: "Keter: Bastion", notes: "พลังบุกสูง เกมจบไว" },
  ],
  A: [
    { deck: "Dragon Empire: Nirvana", notes: "เสถียรและต่อสู้ได้หลายแผน" },
    { deck: "Brandt Gate: Orfist" },
  ],
  B: [
    { deck: "Dark States: Baromagnes" },
    { deck: "Stoicheia: Zorga" },
  ],
  C: [{ deck: "Others / Rogue", notes: "ต้องอ่านเมต้าและจับทางคู่ต่อสู้" }],
};

// ———————— UI helpers —————————
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
  return <Badge className={`rounded-full ${styleMap[r] || styleMap.Common}`}>{r}</Badge>;
}

function TierBadge({ t }: { t: Tier }) {
  const map: Record<Tier, string> = {
    S: "bg-fuchsia-400 text-slate-900",
    A: "bg-amber-400 text-slate-900",
    B: "bg-blue-400 text-slate-900",
    C: "bg-slate-300 text-slate-900",
  };
  return <Badge className={`rounded-full ${map[t]} font-bold`}>Tier {t}</Badge>;
}

export default function CardAbilityBrowser() {
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟิลเตอร์
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState<"ทั้งหมด" | string>("ทั้งหมด");
  const [rarity, setRarity] = useState<"ทั้งหมด" | string>("ทั้งหมด");
  const [typeFilter, setTypeFilter] = useState<"ทั้งหมด" | string>("ทั้งหมด");
  const [gradeFilter, setGradeFilter] = useState<"ทั้งหมด" | string>("ทั้งหมด");

  // โหลดข้อมูล
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch("/api/cards", { cache: "no-store" });
        const raw = await r.text();
        let j: any;
        try {
          j = JSON.parse(raw);
        } catch {
          throw new Error("API /api/cards ไม่ได้ส่ง JSON");
        }
        if (!r.ok) throw new Error(j?.error || "โหลดการ์ดไม่สำเร็จ");
        const list: TcgCard[] = (j.cards || []).map((c: any) => ({
          id: c.id,
          code: c.code ?? c.sku ?? "",
          name: c.name ?? "",
          image_url: c.image_url ?? c.img ?? "",
          set_name: c.set_name ?? c.set ?? "-",
          rarity: c.rarity ?? "Common",
          type_line: c.type_line ?? c.type ?? "-",
          grade: c.grade ?? null,
          power: c.power ?? null,
          shield: c.shield ?? null,
          nation: c.nation ?? null,
          clan: c.clan ?? null,
          attribute: c.attribute ?? null,
          ability_text: c.ability_text ?? c.text ?? "",
        }));
        setCards(list);
      } catch (e: any) {
        setError(e?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ตัวเลือกฟิลเตอร์
  const sets = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(cards.map((c) => c.set_name ?? "-")))],
    [cards]
  );
  const rarities = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(cards.map((c) => c.rarity ?? "Common")))],
    [cards]
  );
  const types = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(cards.map((c) => c.type_line ?? "-")))],
    [cards]
  );
  const grades = useMemo(() => {
    const raw = Array.from(new Set(cards.map((c) => (c.grade ?? "-").toString())));
    return ["ทั้งหมด", ...raw];
  }, [cards]);

  // กรองการ์ด
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const okSet = setFilter === "ทั้งหมด" || (c.set_name ?? "") === setFilter;
      const okR = rarity === "ทั้งหมด" || (c.rarity ?? "").toString() === rarity;
      const okT = typeFilter === "ทั้งหมด" || (c.type_line ?? "") === typeFilter;
      const okG = gradeFilter === "ทั้งหมด" || (c.grade ?? "").toString() === gradeFilter;
      const okQ =
        q === "" ||
        c.name.toLowerCase().includes(q) ||
        (c.code ?? "").toLowerCase().includes(q) ||
        (c.set_name ?? "").toLowerCase().includes(q) ||
        (c.ability_text ?? "").toLowerCase().includes(q);
      return okSet && okR && okT && okG && okQ;
    });
  }, [cards, query, setFilter, rarity, typeFilter, gradeFilter]);

  // รูป: ใช้อัตราส่วน 61:89 ตลอด (ลบโหมดขนาดจริงแล้ว)
  const cardImageWrapClass = "relative aspect-[61/89] w-full";

  const copyAbility = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur bg-slate-900/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-400" />
            <div className="text-xl font-semibold tracking-wide">Vanguard</div>
            <Badge className="ml-1 rounded-full bg-amber-400 text-slate-900">ดูความสามารถการ์ด</Badge>
          </div>

          <div className="ml-auto flex items-center gap-2 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา: ชื่อการ์ด / รหัส / ข้อความในสกิล"
                className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* 🔁 เปลี่ยนปุ่มโหมดขนาดจริง → ปุ่ม Tier List */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="border-white/30 text-slate-900 bg-amber-400 hover:bg-amber-300 gap-2">
                  <Layers className="w-4 h-4" /> Tier List
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    เมต้าเด็ค — Tier List
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(TIER_LIST) as Tier[]).map((t) => (
                    <Card key={t} className="bg-slate-100 text-slate-900 rounded-2xl">
                      <CardHeader className="flex-row items-center justify-between">
                        <TierBadge t={t} />
                        <Star className="w-4 h-4 text-amber-500" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {TIER_LIST[t].map((d, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <div>
                              <div className="font-medium">{d.deck}</div>
                              {d.notes && <div className="text-xs text-slate-600">{d.notes}</div>}
                            </div>
                          </div>
                        ))}
                        {TIER_LIST[t].length === 0 && (
                          <div className="text-sm text-slate-500">— ไม่มีข้อมูล —</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              สำรวจ <span className="text-amber-400 drop-shadow-lg">การ์ดทั้งหมด</span> แล้วอ่านความสามารถอย่างรวดเร็ว
            </h1>
            <p className="text-slate-300 text-lg">
              ค้นหาด้วยชื่อ รหัส หรือคำสำคัญของสกิล กรองตามเซ็ต/ความหายาก/ประเภท/เกรด และเปิดดูรายละเอียดแบบเต็ม ๆ
            </p>
            <a
              href="#cards"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-2xl shadow-md transition-all duration-300 hover:scale-105 w-max"
            >
              🔍 เริ่มค้นหาเลย
            </a>
          </div>
          <div className="hidden md:block">
            <CardsCoverflow />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">เซ็ต</Label>
            <Select value={setFilter} onValueChange={(v: any) => setSetFilter(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <Filter className="mr-2 h-4 w-4" />
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
                {rarities.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">ประเภท</Label>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-[64px] text-slate-300">เกรด</Label>
            <Select value={gradeFilter} onValueChange={(v: any) => setGradeFilter(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main id="cards" className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading && <div className="col-span-full text-slate-300">กำลังโหลดการ์ด…</div>}
          {error && <div className="col-span-full text-red-300">โหลดไม่สำเร็จ: {error}</div>}

          {!loading &&
            !error &&
            filtered.map((c) => (
              <Dialog key={c.id}>
                <DialogTrigger asChild>
                  <Card className="bg-transparent border-none shadow-none rounded-none cursor-pointer">
  <CardHeader className="p-0">
    <div className="relative aspect-[61/89] w-full">
      <img
        src={c.image_url || "/placeholder-card.png"}
        alt={c.name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  </CardHeader>
</Card>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {c.name}
                      {c.code && (
                        <Badge variant="secondary" className="bg-slate-200 text-slate-900">
                          {c.code}
                        </Badge>
                      )}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-transparent rounded-none overflow-visible">
                      <div className={cardImageWrapClass}>
                        <img
                          src={c.image_url || "/placeholder-card.png"}
                          alt={c.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 text-slate-900">
                      <div className="flex flex-wrap gap-2">
                        {c.set_name && (
                          <Badge className="bg-slate-800 text-slate-100 rounded-full">{c.set_name}</Badge>
                        )}
                        {c.rarity && <RarityBadge rarity={c.rarity} />}
                        {c.type_line && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full">{c.type_line}</Badge>
                        )}
                        {c.grade != null && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full flex items-center gap-1">
                            <Layers className="w-3 h-3" /> G{String(c.grade)}
                          </Badge>
                        )}
                        {typeof c.power === "number" && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full flex items-center gap-1">
                            <Swords className="w-3 h-3" /> {c.power}
                          </Badge>
                        )}
                        {typeof c.shield === "number" && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {c.shield}
                          </Badge>
                        )}
                        {c.attribute && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full">{c.attribute}</Badge>
                        )}
                        {c.nation && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full">{c.nation}</Badge>
                        )}
                        {c.clan && (
                          <Badge className="bg-slate-700 text-slate-100 rounded-full">{c.clan}</Badge>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white border">
                        <div className="font-medium mb-2 flex items-center gap-2 text-slate-800">
                          <Sparkles className="w-4 h-4" /> ความสามารถ
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {c.ability_text || "—"}
                        </div>
                        {c.ability_text && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => copyAbility(c.ability_text!)}
                            >
                              <Copy className="w-4 h-4" /> คัดลอกข้อความสกิล
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-6 pb-10 text-sm text-slate-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>© {new Date().getFullYear()} TCG Vault — โหมดดูความสามารถการ์ด • ติดต่อ LINE: @yourlineid</div>
            <div className="flex gap-4">
              <span>คู่มือการใช้งาน</span>
              <span>คำถามที่พบบ่อย</span>
              <span>ติดต่อเรา</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
