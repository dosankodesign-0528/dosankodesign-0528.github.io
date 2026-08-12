"use client";

/*
 * カモメの位置・見た目の調整パネル
 * - 本物のTOPページを表示しながら、カモメごとに位置/サイズ/角度/線幅/速さをいじれる
 * - 「保存して再生」で値をこのブラウザに保存してリロード
 * - 決まった値は Claude に伝えれば本番のデフォルトに反映
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import SoundUi from "@/components/SoundUi";
import {
  BIRDS_STORAGE_KEY,
  DEFAULT_BIRDS,
  mergeBirds,
  type BirdTune,
  type BirdsConfig,
} from "@/components/birdConfig";

const LABELS: Record<keyof BirdsConfig, string> = {
  skyTopLeft: "空・左上の小さいカモメ",
  skyRight: "空・右中の大きいカモメ（手前）",
  promo1: "プロモ内・右上のカモメ",
  promo2: "プロモ内・左の小さいカモメ",
};

/* 位置の単位（空=px / プロモ=%） */
const UNITS: Record<keyof BirdsConfig, string> = {
  skyTopLeft: "px",
  skyRight: "px（右端から）",
  promo1: "%",
  promo2: "%",
};

function Row({
  label,
  value,
  step = 1,
  min = -200,
  max = 1000,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 py-1 pl-4">
      <span className="text-[12px] font-bold text-[#1e1e1e]">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          className="w-[74px] rounded border border-[#bcd6ea] bg-white px-1.5 py-0.5 text-right text-[12px] font-bold text-[#0070c9]"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="w-[64px] text-[10px] text-[#7ba7cc]">{unit}</span>
      </span>
    </label>
  );
}

export default function BirdsTunePage() {
  const [loaded, setLoaded] = useState(false);
  const [birds, setBirds] = useState<BirdsConfig>(DEFAULT_BIRDS);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BIRDS_STORAGE_KEY);
      if (raw) setBirds(mergeBirds(JSON.parse(raw)));
    } catch {}
    setLoaded(true);
  }, []);

  const upd = (key: keyof BirdsConfig, patch: Partial<BirdTune>) =>
    setBirds((b) => ({ ...b, [key]: { ...b[key], ...patch } }));

  const saveAndReplay = () => {
    localStorage.setItem(BIRDS_STORAGE_KEY, JSON.stringify(birds));
    location.reload();
  };
  const reset = () => {
    localStorage.removeItem(BIRDS_STORAGE_KEY);
    location.reload();
  };

  return (
    <>
      {loaded && (
        <Stage illustration="tamannee" illustEntrance birds={birds}>
          <TopMock intro={2} combo writePace={2} birds={birds} />
        </Stage>
      )}
      <SoundUi />

      {/* 調整パネル */}
      <div className="fixed right-3 top-3 z-[70] w-[300px]">
        <div className="rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[14px] font-black text-[#0070c9]">🕊 カモメ調整</p>
            <button
              onClick={() => setOpen((o) => !o)}
              className="cursor-pointer rounded-full bg-[#e6f3ff] px-2 py-0.5 text-[11px] font-bold text-[#0070c9]"
            >
              {open ? "たたむ" : "ひらく"}
            </button>
          </div>

          {open && (
            <>
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                {(Object.keys(LABELS) as (keyof BirdsConfig)[]).map((key, i) => (
                  <details key={key} open={i === 1} className="border-b border-[#e0eefb] py-1">
                    <summary className="cursor-pointer select-none py-1 text-[13px] font-black text-[#0070c9]">
                      {LABELS[key]}
                    </summary>
                    <div className="pb-1">
                      <Row label="位置X" value={birds[key].x} unit={UNITS[key]} onChange={(v) => upd(key, { x: v })} />
                      <Row label="位置Y" value={birds[key].y} unit={UNITS[key].startsWith("%") ? "%" : "px"} onChange={(v) => upd(key, { y: v })} />
                      <Row label="大きさ（横幅）" value={birds[key].w} min={16} max={400} unit="px" onChange={(v) => upd(key, { w: v })} />
                      <Row label="傾き" value={birds[key].rotate} min={-90} max={90} unit="度" onChange={(v) => upd(key, { rotate: v })} />
                      <Row label="線の太さ" value={birds[key].stroke} step={0.5} min={1} max={14} unit="" onChange={(v) => upd(key, { stroke: v })} />
                      <Row label="羽ばたき周期" value={birds[key].flap} step={0.05} min={0.2} max={2} unit="秒" onChange={(v) => upd(key, { flap: v })} />
                      <Row label="ふわふわ周期" value={birds[key].drift} step={0.5} min={2} max={20} unit="秒" onChange={(v) => upd(key, { drift: v })} />
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={saveAndReplay}
                  className="flex-1 cursor-pointer rounded-full bg-[#0070c9] py-2 text-[13px] font-black text-white transition-transform hover:scale-105"
                >
                  ▶ 保存して再生
                </button>
                <button
                  onClick={reset}
                  className="cursor-pointer rounded-full bg-[#e6f3ff] px-3 py-2 text-[12px] font-bold text-[#0070c9]"
                >
                  初期値
                </button>
              </div>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#7ba7cc]">
                値はこのブラウザにだけ保存されます。決まったら数値をClaudeに伝えてください（本番に反映します）
              </p>
            </>
          )}
        </div>
        <Link
          href="/"
          className="mt-2 inline-block rounded-full bg-white/95 px-4 py-1.5 text-[12px] font-black text-[#0070c9] shadow"
        >
          ← TOPへ
        </Link>
      </div>
    </>
  );
}
