"use client";

/**
 * 日付レンジスライダー - ボリュームゾーン可視化 比較モック
 *
 * 案A（両端つまみレンジスライダー）をベースに、
 * 「どの月にサイトが多いか」がひと目で分かる洗練バリアントを並べる。
 *
 * URL: /mock-date-filter-v2
 */

import { useMemo, useState } from "react";

/* 実データから集計した月別件数（2024-01〜2026-04分）+ 2019-09〜2023-12 をそれっぽく補完。
   FilterBar の globalDateRange を再現するためのモック。 */
const MONTHLY_COUNTS: Record<string, number> = {
  "2019-09": 8, "2019-10": 12, "2019-11": 15, "2019-12": 11,
  "2020-01": 14, "2020-02": 18, "2020-03": 22, "2020-04": 28,
  "2020-05": 25, "2020-06": 30, "2020-07": 32, "2020-08": 35,
  "2020-09": 38, "2020-10": 42, "2020-11": 40, "2020-12": 36,
  "2021-01": 45, "2021-02": 48, "2021-03": 52, "2021-04": 50,
  "2021-05": 55, "2021-06": 58, "2021-07": 60, "2021-08": 55,
  "2021-09": 58, "2021-10": 62, "2021-11": 60, "2021-12": 55,
  "2022-01": 58, "2022-02": 60, "2022-03": 65, "2022-04": 62,
  "2022-05": 68, "2022-06": 70, "2022-07": 72, "2022-08": 68,
  "2022-09": 70, "2022-10": 72, "2022-11": 75, "2022-12": 68,
  "2023-01": 72, "2023-02": 70, "2023-03": 75, "2023-04": 78,
  "2023-05": 80, "2023-06": 82, "2023-07": 78, "2023-08": 75,
  "2023-09": 80, "2023-10": 82, "2023-11": 78, "2023-12": 75,
  // ここから実データ
  "2024-01": 65, "2024-02": 80, "2024-03": 81, "2024-04": 98,
  "2024-05": 93, "2024-06": 89, "2024-07": 95, "2024-08": 98,
  "2024-09": 96, "2024-10": 112, "2024-11": 99, "2024-12": 122,
  "2025-01": 140, "2025-02": 135, "2025-03": 143, "2025-04": 129,
  "2025-05": 148, "2025-06": 148, "2025-07": 143, "2025-08": 160,
  "2025-09": 196, "2025-10": 182, "2025-11": 165, "2025-12": 220,
  "2026-01": 130, "2026-02": 117, "2026-03": 162, "2026-04": 140,
};

const MONTHS = Object.keys(MONTHLY_COUNTS).sort();
const COUNTS = MONTHS.map((m) => MONTHLY_COUNTS[m]);
const MAX_COUNT = Math.max(...COUNTS);
const TOTAL = COUNTS.reduce((a, b) => a + b, 0);

export default function MockDateFilterV2Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            日付レンジスライダー - ボリュームゾーン可視化
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            「どの月にサイトが多いか」がひと目で分かる洗練バリアント5案。
            <br />
            下に小さくヒストグラム・エリアチャートなどの背景ビズを敷いた、両端つまみのレンジスライダー。
          </p>
        </header>

        <Section
          no="案1"
          title="ヒストグラム背景（棒グラフ）"
          recommended
          note="月ごとの棒グラフを背景に。選択範囲内は青、外はグレーでくっきり対比。月数が多くても潰れにくい。Airbnb の価格帯フィルタに近い見た目。"
        >
          <VariantHistogram />
        </Section>

        <Section
          no="案2"
          title="スムースなエリアチャート"
          note="SVG でスムージングしたエリアチャートを背景に。ヒストグラムより有機的で柔らかい印象。Web Design Clip みたいなデザインギャラリーに雰囲気が合う。"
        >
          <VariantArea />
        </Section>

        <Section
          no="案3"
          title="ヒートマップ・ストリップ"
          note="1本の帯で件数の多さを色の濃淡で表現。ガントチャートやGitHubの草っぽい雰囲気。スリムで今っぽい。"
        >
          <VariantHeatmap />
        </Section>

        <Section
          no="案4"
          title="ヒストグラム + 件数サマリー"
          note="案1にサマリーピル（「3,586件中 2,410件 選択中」）と年ティックを追加。情報量は多めだが、選択結果が数字で即わかる。"
        >
          <VariantHistogramPlus />
        </Section>

        <Section
          no="案5"
          title="ミニマル・ドットプロット"
          note="各月をドット1個で表現し、サイズで件数を示す。超コンパクトでミニマルな見た目。スライダーのプレゼンス強め。"
        >
          <VariantDots />
        </Section>

        <footer className="text-xs text-gray-400 pt-6 border-t">
          気に入った案を教えてくれたら FilterModal に本実装するで。
        </footer>
      </div>
    </div>
  );
}

/* ========== 共通 ========== */

function Section({
  no,
  title,
  note,
  recommended,
  children,
}: {
  no: string;
  title: string;
  note: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-[11px] font-bold text-gray-500 tabular-nums">{no}</span>
        <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
        {recommended && (
          <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
            おすすめ
          </span>
        )}
      </div>
      <div className="px-5 py-5">
        <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-100">{children}</div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{note}</p>
      </div>
    </section>
  );
}

function useRange() {
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(MONTHS.length - 1);
  const selectedTotal = useMemo(() => {
    return COUNTS.slice(fromIdx, toIdx + 1).reduce((a, b) => a + b, 0);
  }, [fromIdx, toIdx]);
  return { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </div>
  );
}

function DualSlider({
  fromIdx,
  toIdx,
  setFromIdx,
  setToIdx,
}: {
  fromIdx: number;
  toIdx: number;
  setFromIdx: (v: number) => void;
  setToIdx: (v: number) => void;
}) {
  return (
    <div className="relative h-5 pointer-events-none">
      <input
        type="range"
        min={0}
        max={MONTHS.length - 1}
        value={fromIdx}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v <= toIdx) setFromIdx(v);
        }}
        className="absolute inset-0 w-full h-5 appearance-none bg-transparent dual-slider"
        style={{ zIndex: fromIdx > MONTHS.length - 2 ? 5 : 3 }}
      />
      <input
        type="range"
        min={0}
        max={MONTHS.length - 1}
        value={toIdx}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= fromIdx) setToIdx(v);
        }}
        className="absolute inset-0 w-full h-5 appearance-none bg-transparent dual-slider"
        style={{ zIndex: 4 }}
      />
      <style jsx>{`
        .dual-slider {
          pointer-events: none;
        }
        .dual-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: grab;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          transition: transform 0.1s;
        }
        .dual-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .dual-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .dual-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: grab;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }
        .dual-slider::-webkit-slider-runnable-track {
          background: transparent;
          height: 20px;
        }
        .dual-slider::-moz-range-track {
          background: transparent;
          height: 20px;
        }
      `}</style>
    </div>
  );
}

function RangeHeader({
  fromIdx,
  toIdx,
  selectedTotal,
}: {
  fromIdx: number;
  toIdx: number;
  selectedTotal: number;
}) {
  return (
    <div className="flex items-end justify-between mb-2">
      <Label>日付レンジ</Label>
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] text-gray-500 tabular-nums">
          {selectedTotal.toLocaleString()} / {TOTAL.toLocaleString()} 件
        </span>
        <span className="text-[13px] font-semibold text-gray-900 tabular-nums">
          {MONTHS[fromIdx]} — {MONTHS[toIdx]}
        </span>
      </div>
    </div>
  );
}

function Footer({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums mt-1">
      <span>{MONTHS[0]}</span>
      <button onClick={onReset} className="text-blue-600 hover:underline">
        日付をリセット
      </button>
      <span>{MONTHS[MONTHS.length - 1]}</span>
    </div>
  );
}

/* ========== 案1: ヒストグラム ========== */

function VariantHistogram() {
  const { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal } = useRange();

  return (
    <div>
      <RangeHeader fromIdx={fromIdx} toIdx={toIdx} selectedTotal={selectedTotal} />

      <div className="relative pb-3">
        {/* ヒストグラム背景 */}
        <div className="flex items-end gap-[2px] h-12">
          {COUNTS.map((c, i) => {
            const inRange = i >= fromIdx && i <= toIdx;
            const h = Math.max(4, (c / MAX_COUNT) * 48);
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-colors ${
                  inRange ? "bg-blue-400" : "bg-gray-200"
                }`}
                style={{ height: `${h}px` }}
                title={`${MONTHS[i]}: ${c}件`}
              />
            );
          })}
        </div>
        {/* 選択範囲を示す青いライン（これがスライダーのトラック役） */}
        <div className="relative h-0 mt-1">
          <div
            className="absolute h-[2px] bg-blue-500 rounded-full transition-all"
            style={{
              left: `${(fromIdx / (MONTHS.length - 1)) * 100}%`,
              right: `${100 - (toIdx / (MONTHS.length - 1)) * 100}%`,
            }}
          />
        </div>
        {/* 丸ポチ */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          <DualSlider
            fromIdx={fromIdx}
            toIdx={toIdx}
            setFromIdx={setFromIdx}
            setToIdx={setToIdx}
          />
        </div>
      </div>

      <Footer
        onReset={() => {
          setFromIdx(0);
          setToIdx(MONTHS.length - 1);
        }}
      />
    </div>
  );
}

/* ========== 案2: スムースなエリアチャート ========== */

function VariantArea() {
  const { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal } = useRange();

  // 滑らかなカトマル-ロム風のパスを生成（簡易版: 中点経由の2次ベジェ）
  const pathD = useMemo(() => {
    const w = 1000; // viewBox
    const h = 60;
    const pts = COUNTS.map((c, i) => {
      const x = (i / (COUNTS.length - 1)) * w;
      const y = h - (c / MAX_COUNT) * h;
      return { x, y };
    });
    let d = `M 0,${h} L ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` Q ${midX.toFixed(2)},${prev.y.toFixed(2)} ${((midX + curr.x) / 2).toFixed(2)},${(
        (prev.y + curr.y) / 2
      ).toFixed(2)}`;
    }
    d += ` L ${w},${pts[pts.length - 1].y.toFixed(2)} L ${w},${h} Z`;
    return d;
  }, []);

  const leftPct = (fromIdx / (MONTHS.length - 1)) * 100;
  const rightPct = (toIdx / (MONTHS.length - 1)) * 100;

  return (
    <div>
      <RangeHeader fromIdx={fromIdx} toIdx={toIdx} selectedTotal={selectedTotal} />

      <div className="relative pb-3">
        {/* エリアチャート */}
        <svg
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          className="w-full h-12 overflow-visible"
        >
          <defs>
            <linearGradient id="area-grad-selected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="area-grad-muted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.05" />
            </linearGradient>
            <clipPath id="clip-selected">
              <rect x={leftPct * 10} y={0} width={(rightPct - leftPct) * 10} height={60} />
            </clipPath>
            <clipPath id="clip-muted-left">
              <rect x={0} y={0} width={leftPct * 10} height={60} />
            </clipPath>
            <clipPath id="clip-muted-right">
              <rect x={rightPct * 10} y={0} width={1000 - rightPct * 10} height={60} />
            </clipPath>
          </defs>
          <path d={pathD} fill="url(#area-grad-muted)" clipPath="url(#clip-muted-left)" />
          <path d={pathD} fill="url(#area-grad-muted)" clipPath="url(#clip-muted-right)" />
          <path d={pathD} fill="url(#area-grad-selected)" clipPath="url(#clip-selected)" />
          {/* トップライン */}
          <path
            d={pathD.replace(/ L \d+,\d+(\.\d+)? Z/, "").replace(/ L \d+,\d+(\.\d+)? /, " ")}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            clipPath="url(#clip-selected)"
          />
        </svg>

        {/* 選択範囲を示す青いライン（これがスライダーのトラック役） */}
        <div className="relative h-0 mt-1">
          <div
            className="absolute h-[2px] bg-blue-500 rounded-full transition-all"
            style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
          />
        </div>
        {/* 丸ポチ */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          <DualSlider
            fromIdx={fromIdx}
            toIdx={toIdx}
            setFromIdx={setFromIdx}
            setToIdx={setToIdx}
          />
        </div>
      </div>

      <Footer
        onReset={() => {
          setFromIdx(0);
          setToIdx(MONTHS.length - 1);
        }}
      />
    </div>
  );
}

/* ========== 案3: ヒートマップ・ストリップ ========== */

function VariantHeatmap() {
  const { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal } = useRange();

  return (
    <div>
      <RangeHeader fromIdx={fromIdx} toIdx={toIdx} selectedTotal={selectedTotal} />

      <div className="relative py-3">
        {/* ヒートマップ帯 */}
        <div className="flex gap-[1px] h-4 rounded-md overflow-hidden">
          {COUNTS.map((c, i) => {
            const inRange = i >= fromIdx && i <= toIdx;
            const intensity = c / MAX_COUNT; // 0..1
            // 5段階の濃淡
            const bucket = intensity < 0.2 ? 0 : intensity < 0.4 ? 1 : intensity < 0.6 ? 2 : intensity < 0.8 ? 3 : 4;
            const selectedColors = ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"];
            const mutedColors = ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280"];
            const color = inRange ? selectedColors[bucket] : mutedColors[bucket];
            return (
              <div
                key={i}
                className="flex-1 transition-colors"
                style={{ backgroundColor: color }}
                title={`${MONTHS[i]}: ${c}件`}
              />
            );
          })}
        </div>

        {/* 選択範囲を示す青いライン（これがスライダーのトラック役） */}
        <div className="relative h-0 mt-2">
          <div
            className="absolute h-[2px] bg-blue-500 rounded-full transition-all"
            style={{
              left: `${(fromIdx / (MONTHS.length - 1)) * 100}%`,
              right: `${100 - (toIdx / (MONTHS.length - 1)) * 100}%`,
            }}
          />
        </div>
        {/* 丸ポチ */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          <DualSlider
            fromIdx={fromIdx}
            toIdx={toIdx}
            setFromIdx={setFromIdx}
            setToIdx={setToIdx}
          />
        </div>
      </div>

      <Footer
        onReset={() => {
          setFromIdx(0);
          setToIdx(MONTHS.length - 1);
        }}
      />
    </div>
  );
}

/* ========== 案4: ヒストグラム + 件数サマリー + 年ティック ========== */

function VariantHistogramPlus() {
  const { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal } = useRange();

  // 年ティック位置（各年の1月のindex）
  const yearTicks = useMemo(() => {
    return MONTHS.map((m, i) => ({ idx: i, year: m.slice(0, 4), month: m.slice(5) }))
      .filter((t) => t.month === "01")
      .map((t) => ({ idx: t.idx, year: t.year }));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>日付レンジ</Label>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-[11px] tabular-nums">
          <span className="text-gray-500">選択中</span>
          <span className="font-bold text-blue-700">{selectedTotal.toLocaleString()}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{TOTAL.toLocaleString()}件</span>
        </div>
      </div>

      <div className="relative pb-3">
        <div className="flex items-end gap-[2px] h-14">
          {COUNTS.map((c, i) => {
            const inRange = i >= fromIdx && i <= toIdx;
            const h = Math.max(4, (c / MAX_COUNT) * 56);
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-colors ${
                  inRange ? "bg-blue-500" : "bg-gray-200"
                }`}
                style={{ height: `${h}px`, opacity: inRange ? 0.85 : 1 }}
                title={`${MONTHS[i]}: ${c}件`}
              />
            );
          })}
        </div>
        {/* 選択範囲を示す青いライン（これがスライダーのトラック役） */}
        <div className="relative h-0 mt-1">
          <div
            className="absolute h-[2px] bg-blue-600 rounded-full transition-all"
            style={{
              left: `${(fromIdx / (MONTHS.length - 1)) * 100}%`,
              right: `${100 - (toIdx / (MONTHS.length - 1)) * 100}%`,
            }}
          />
        </div>
        {/* 丸ポチ */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          <DualSlider
            fromIdx={fromIdx}
            toIdx={toIdx}
            setFromIdx={setFromIdx}
            setToIdx={setToIdx}
          />
        </div>
      </div>

      {/* 年ティック */}
      <div className="relative h-4 mt-1">
        {yearTicks.map((t) => (
          <div
            key={t.year}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${(t.idx / (MONTHS.length - 1)) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-px h-1 bg-gray-300" />
            <span className="text-[9px] text-gray-400 tabular-nums mt-0.5">{t.year}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums mt-2">
        <span>{MONTHS[fromIdx]}</span>
        <button
          onClick={() => {
            setFromIdx(0);
            setToIdx(MONTHS.length - 1);
          }}
          className="text-blue-600 hover:underline"
        >
          日付をリセット
        </button>
        <span>{MONTHS[toIdx]}</span>
      </div>
    </div>
  );
}

/* ========== 案5: ミニマル・ドットプロット ========== */

function VariantDots() {
  const { fromIdx, setFromIdx, toIdx, setToIdx, selectedTotal } = useRange();

  return (
    <div>
      <RangeHeader fromIdx={fromIdx} toIdx={toIdx} selectedTotal={selectedTotal} />

      <div className="relative py-2 pb-4">
        <div className="flex items-center gap-[2px] h-8">
          {COUNTS.map((c, i) => {
            const inRange = i >= fromIdx && i <= toIdx;
            const size = Math.max(3, Math.round((c / MAX_COUNT) * 9));
            return (
              <div key={i} className="flex-1 flex items-center justify-center" title={`${MONTHS[i]}: ${c}件`}>
                <div
                  className={`rounded-full transition-colors ${
                    inRange ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  style={{ width: size, height: size }}
                />
              </div>
            );
          })}
        </div>
        {/* 選択範囲を示す青いライン（これがスライダーのトラック役） */}
        <div className="relative h-0 mt-1">
          <div
            className="absolute h-[2px] bg-blue-500 rounded-full transition-all"
            style={{
              left: `${(fromIdx / (MONTHS.length - 1)) * 100}%`,
              right: `${100 - (toIdx / (MONTHS.length - 1)) * 100}%`,
            }}
          />
        </div>
        {/* 丸ポチ */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          <DualSlider
            fromIdx={fromIdx}
            toIdx={toIdx}
            setFromIdx={setFromIdx}
            setToIdx={setToIdx}
          />
        </div>
      </div>

      <Footer
        onReset={() => {
          setFromIdx(0);
          setToIdx(MONTHS.length - 1);
        }}
      />
    </div>
  );
}
