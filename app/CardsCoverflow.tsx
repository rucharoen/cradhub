"use client";

import { useEffect, useRef, useState } from "react";

const imgs = [
  "https://inwfile.com/s-b/hneumx.jpg",
  "https://inwfile.com/s-b/wqwt80.jpg",
  "https://inwfile.com/s-b/c438de.jpg",
];

export default function CardsCoverflow() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(0);

  // ✅ ใช้ ReturnType<typeof setInterval> เพื่อให้ทำงานได้ทั้ง browser/node
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = () => setI((p) => (p + 1) % imgs.length);
  const prev = () => setI((p) => (p - 1 + imgs.length) % imgs.length);

  useEffect(() => {
    if (paused) return; // ok: undefined/void ได้
    // เคลียร์ตัวเดิมก่อน
    if (timer.current) {
      clearInterval(timer.current);
    }
    // ตั้งตัวใหม่
    timer.current = setInterval(next, 6000);

    // ✅ cleanup ต้องคืนค่าเป็น void เสมอ
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [paused, i]);

  const onStart = (x: number) => (startX.current = x);
  const onEnd = (x: number) => {
    const dx = x - startX.current;
    if (dx > 40) prev();
    if (dx < -40) next();
  };

  return (
    <div
      className="relative h-[22rem] select-none"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onStart(e.clientX)}
      onMouseUp={(e) => onEnd(e.clientX)}
    >
      <div className="absolute inset-0">
        {imgs.map((src, idx) => {
          let rel = (idx - i + imgs.length) % imgs.length;
          if (rel > 1) rel -= imgs.length; // -> …,-2,-1,0,1
          const isCenter = rel === 0;
          const isLeft = rel === -1;
          const isRight = rel === 1;

          const base =
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 " +
            "w-56 md:w-64 h-80 md:h-96 rounded-2xl shadow-2xl object-cover " +
            "transition-all duration-500 cursor-pointer";
          const state = isCenter
            ? "z-20 scale-100 translate-x-0"
            : isLeft
            ? "z-10 scale-[0.9] -translate-x-[38%] opacity-90"
            : isRight
            ? "z-10 scale-[0.9] translate-x-[38%] opacity-90"
            : "opacity-0 pointer-events-none";

          return (
            <img
              key={idx}
              src={src}
              alt={`Card ${idx + 1}`}
              className={`${base} ${state}`}
              onClick={() => setI(idx)} // คลิกให้ขึ้นกลาง
            />
          );
        })}
      </div>
    </div>
  );
}
