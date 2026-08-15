"use client";

/*
 * 眉毛ピクッの調整パネル
 * - 本物のTOPページを表示したまま、動く量とテンポをスライダーで調整できる
 * - 動きが細かくて実機だと見づらいので、顔だけ拡大した「のぞき窓」を付けてある
 * - 値はその場で反映される（保存して再生は不要）
 */
import { useState } from "react";
import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import TunePanel from "@/components/TunePanel";
import IllustTamannee from "@/components/IllustTamannee";
import { DEFAULT_BROW, type BrowConfig } from "@/components/browConfig";

/* のぞき窓の中心。イラスト（284x357表示）上での眉の真ん中の座標 */
const LOUPE = { x: 130, y: 99, zoom: 2.6 };

const TARGETS: { value: BrowConfig["target"]; label: string }[] = [
  { value: "both", label: "両方" },
  { value: "right", label: "右だけ" },
  { value: "left", label: "左だけ" },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block py-1.5 pl-1">
      <span className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#1e1e1e]">{label}</span>
        <span className="text-[12px] font-black text-[#0070c9]">
          {value}
          <span className="ml-0.5 text-[10px] text-[#7ba7cc]">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        className="mt-1 w-full accent-[#0070c9]"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function BrowTunePage() {
  const [brow, setBrow] = useState<BrowConfig>(DEFAULT_BROW);
  const upd = (patch: Partial<BrowConfig>) => setBrow((b) => ({ ...b, ...patch }));

  return (
    <>
      <Stage illustration="tamannee" brow={brow}>
        <TopMock intro={2} />
      </Stage>

      <TunePanel title="🤨 眉毛ピクッ調整">
        {/* 顔だけ拡大して覗く窓。実機でも動きが分かるように */}
        <div className="mb-3 overflow-hidden rounded-lg border border-[#bcd6ea] bg-white">
          <div className="relative h-[170px] w-full">
            <div
              className="absolute left-1/2 top-1/2 h-[357px] w-[284px]"
              style={{
                /* 眉の中心を窓のまん中に固定したまま拡大する */
                transformOrigin: `${LOUPE.x}px ${LOUPE.y}px`,
                transform: `translate(${-LOUPE.x}px, ${-LOUPE.y}px) scale(${LOUPE.zoom})`,
              }}
            >
              <IllustTamannee brow={brow} className="size-full" />
            </div>
          </div>
          <p className="bg-[#e6f3ff] px-2 py-1 text-[10px] font-bold text-[#0070c9]">
            ↑ 眉のまわりを{LOUPE.zoom}倍にした確認用（本番の見え方は後ろのイラスト）
          </p>
        </div>

        <Slider
          label="持ち上がる量"
          value={brow.lift}
          min={0}
          max={20}
          step={0.5}
          unit="px"
          onChange={(v) => upd({ lift: v })}
        />
        <Slider
          label="テンポ（キラキラと共通）"
          value={brow.cycle}
          min={0.4}
          max={4}
          step={0.1}
          unit="秒"
          onChange={(v) => upd({ cycle: v })}
        />

        <div className="py-1.5 pl-1">
          <span className="text-[12px] font-bold text-[#1e1e1e]">動かす眉</span>
          <div className="mt-1 flex gap-1.5">
            {TARGETS.map((t) => (
              <button
                key={t.value}
                onClick={() => upd({ target: t.value })}
                className={`flex-1 cursor-pointer rounded-full py-1.5 text-[12px] font-black transition-colors ${
                  brow.target === t.value
                    ? "bg-[#0070c9] text-white"
                    : "bg-[#e6f3ff] text-[#0070c9]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-[#f4f9ff] p-2">
          <p className="text-[10px] font-bold text-[#7ba7cc]">いまの設定</p>
          <code className="text-[11px] font-black text-[#0070c9]">
            lift: {brow.lift}, cycle: {brow.cycle}, target: &quot;{brow.target}&quot;
          </code>
        </div>

        <button
          onClick={() => setBrow(DEFAULT_BROW)}
          className="mt-2 w-full cursor-pointer rounded-full bg-[#e6f3ff] py-2 text-[12px] font-bold text-[#0070c9]"
        >
          初期値にもどす
        </button>
        <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#7ba7cc]">
          決まったら上の3つの数字をClaudeに伝えてください（本番に反映します）
        </p>
        <Link
          href="/"
          className="mt-2 inline-block rounded-full bg-[#e6f3ff] px-4 py-1.5 text-[12px] font-black text-[#0070c9]"
        >
          ← TOPへ
        </Link>
      </TunePanel>
    </>
  );
}
