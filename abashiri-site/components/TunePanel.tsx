"use client";

/*
 * 調整パネル共通シェル
 * - ヘッダーをドラッグして好きな位置に移動できる
 * - 「たたむ/ひらく」で折りたためる
 * 今後の調整パネルは必ずこれで作る（ヒデさんルール）
 */
import { useRef, useState } from "react";

export default function TunePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const off = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const move = (ev: PointerEvent) =>
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - rect.width, ev.clientX - off.x)),
        y: Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - off.y)),
      });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-[80] w-[300px]"
      style={pos ? { left: pos.x, top: pos.y } : { right: 12, top: 12 }}
    >
      <div className="rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
        <div
          className="mb-1 flex cursor-move select-none items-center justify-between"
          onPointerDown={startDrag}
          title="ドラッグで移動"
        >
          <p className="text-[14px] font-black text-[#0070c9]">{title}</p>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setOpen((o) => !o)}
            className="cursor-pointer rounded-full bg-[#e6f3ff] px-2 py-0.5 text-[11px] font-bold text-[#0070c9]"
          >
            {open ? "たたむ" : "ひらく"}
          </button>
        </div>
        {open && children}
      </div>
    </div>
  );
}
