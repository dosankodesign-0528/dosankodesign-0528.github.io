"use client";

/**
 * 日付フィルターUIの4案比較モック。
 *
 * 既存のFilterModal内「日付レンジ」セクションが縦スペースを食い過ぎなので、
 * コンパクト化候補を4案並べて比較する用の確認ページ。
 *
 * URL: /mock-date-filter
 */

import { useMemo, useState } from "react";

// 年月配列生成（2019-09 〜 2026-04 を想定）
function generateMonths(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const out: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

const GLOBAL_START = "2019-09";
const GLOBAL_END = "2026-04";

export default function MockDateFilterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">日付フィルター コンパクトUI案</h1>
          <p className="text-sm text-gray-600 mt-2">
            現状の縦並びスライダー（左図のような縦長UI）を、もっとコンパクトにする4案。
            <br />
            実データ風の範囲（2019-09〜2026-04）で動く簡易モックです。
          </p>
        </header>

        <Section
          no="案A"
          title="1本のレンジスライダー（両端つまみ）"
          recommended
          note="縦の高さは1行分だけ。左右のつまみで FROM/TO を同時に決める。現状より大幅に省スペース。"
        >
          <VariantA />
        </Section>

        <Section
          no="案B"
          title="プリセット + カスタム"
          note="「直近3ヶ月 / 6ヶ月 / 今年 / すべて」をチップで並べる。細かく決めたい時だけカスタムを開く。"
        >
          <VariantB />
        </Section>

        <Section
          no="案C"
          title="2つのセレクト（年月プルダウン）"
          note="FROM と TO の年月プルダウンを横に並べるだけ。一番シンプル。"
        >
          <VariantC />
        </Section>

        <Section
          no="案D"
          title="スライダー横並び2列"
          note="今の縦並びを横並びに並べ替えただけ。構造の変更は最小。"
        >
          <VariantD />
        </Section>

        <footer className="text-xs text-gray-400 pt-6 border-t">
          どれにするか決まったら言うてくれたら FilterModal に本実装するで。
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </div>
  );
}

/* ========== 案A: デュアルハンドル レンジスライダー ========== */

function VariantA() {
  const months = useMemo(() => generateMonths(GLOBAL_START, GLOBAL_END), []);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(months.length - 1);

  const leftPct = (fromIdx / (months.length - 1)) * 100;
  const rightPct = (toIdx / (months.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>日付レンジ</Label>
        <div className="text-[13px] font-semibold text-gray-900 tabular-nums">
          {months[fromIdx]} — {months[toIdx]}
        </div>
      </div>

      {/* トラック */}
      <div className="relative h-5 flex items-center">
        {/* 背景バー */}
        <div className="absolute inset-x-0 h-1 bg-gray-200 rounded-full" />
        {/* 選択範囲バー */}
        <div
          className="absolute h-1 bg-blue-500 rounded-full"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        {/* FROM スライダー */}
        <input
          type="range"
          min={0}
          max={months.length - 1}
          value={fromIdx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= toIdx) setFromIdx(v);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none dual-slider"
          style={{ zIndex: fromIdx > months.length - 2 ? 5 : 3 }}
        />
        {/* TO スライダー */}
        <input
          type="range"
          min={0}
          max={months.length - 1}
          value={toIdx}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= fromIdx) setToIdx(v);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none dual-slider"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 tabular-nums">
        <span>{GLOBAL_START}</span>
        <button
          onClick={() => {
            setFromIdx(0);
            setToIdx(months.length - 1);
          }}
          className="text-blue-600 hover:underline"
        >
          日付をリセット
        </button>
        <span>{GLOBAL_END}</span>
      </div>

      <style jsx>{`
        .dual-slider {
          -webkit-appearance: none;
          height: 20px;
        }
        .dual-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .dual-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid #3b82f6;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .dual-slider::-webkit-slider-runnable-track {
          background: transparent;
        }
        .dual-slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}

/* ========== 案B: プリセット + カスタム ========== */

type Preset = "3m" | "6m" | "year" | "all" | "custom";

function VariantB() {
  const [preset, setPreset] = useState<Preset>("all");
  const months = useMemo(() => generateMonths(GLOBAL_START, GLOBAL_END), []);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(months.length - 1);

  const display = (() => {
    if (preset === "3m") return "直近3ヶ月";
    if (preset === "6m") return "直近6ヶ月";
    if (preset === "year") return "今年";
    if (preset === "all") return "すべて";
    return `${months[fromIdx]} — ${months[toIdx]}`;
  })();

  const PRESETS: { id: Preset; label: string }[] = [
    { id: "3m", label: "直近3ヶ月" },
    { id: "6m", label: "直近6ヶ月" },
    { id: "year", label: "今年" },
    { id: "all", label: "すべて" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>日付レンジ</Label>
        <div className="text-[13px] font-semibold text-gray-900 tabular-nums">{display}</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`h-7 px-3 rounded-full text-[12px] font-medium border transition-colors ${
              preset === p.id
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setPreset("custom")}
          className={`h-7 px-3 rounded-full text-[12px] font-medium border transition-colors ${
            preset === "custom"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
        >
          カスタム…
        </button>
      </div>

      {preset === "custom" && (
        <div className="pt-2 pl-1 border-l-2 border-blue-200 ml-1 space-y-2">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-gray-500 w-10">FROM</span>
            <input
              type="range"
              min={0}
              max={months.length - 1}
              value={fromIdx}
              onChange={(e) => setFromIdx(Math.min(Number(e.target.value), toIdx))}
              className="flex-1 accent-blue-500"
            />
            <span className="tabular-nums text-gray-900 w-14">{months[fromIdx]}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-gray-500 w-10">TO</span>
            <input
              type="range"
              min={0}
              max={months.length - 1}
              value={toIdx}
              onChange={(e) => setToIdx(Math.max(Number(e.target.value), fromIdx))}
              className="flex-1 accent-blue-500"
            />
            <span className="tabular-nums text-gray-900 w-14">{months[toIdx]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== 案C: 年月プルダウン2つ ========== */

function VariantC() {
  const months = useMemo(() => generateMonths(GLOBAL_START, GLOBAL_END), []);
  const [from, setFrom] = useState(GLOBAL_START);
  const [to, setTo] = useState(GLOBAL_END);

  return (
    <div className="flex flex-col gap-2">
      <Label>日付レンジ</Label>
      <div className="flex items-center gap-2">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="flex-1 h-9 px-3 text-[13px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500 tabular-nums"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-gray-400 text-sm">〜</span>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 h-9 px-3 text-[13px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500 tabular-nums"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setFrom(GLOBAL_START);
            setTo(GLOBAL_END);
          }}
          className="text-[11px] text-blue-600 hover:underline whitespace-nowrap"
        >
          リセット
        </button>
      </div>
    </div>
  );
}

/* ========== 案D: スライダー横並び2列 ========== */

function VariantD() {
  const months = useMemo(() => generateMonths(GLOBAL_START, GLOBAL_END), []);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(months.length - 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>日付レンジ</Label>
        <div className="text-[13px] font-semibold text-gray-900 tabular-nums">
          {months[fromIdx]} — {months[toIdx]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] text-gray-500">FROM</div>
          <input
            type="range"
            min={0}
            max={months.length - 1}
            value={fromIdx}
            onChange={(e) => setFromIdx(Math.min(Number(e.target.value), toIdx))}
            className="w-full accent-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[10px] text-gray-500">TO</div>
          <input
            type="range"
            min={0}
            max={months.length - 1}
            value={toIdx}
            onChange={(e) => setToIdx(Math.max(Number(e.target.value), fromIdx))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <button
        onClick={() => {
          setFromIdx(0);
          setToIdx(months.length - 1);
        }}
        className="self-start text-[11px] text-blue-600 hover:underline"
      >
        日付をリセット
      </button>
    </div>
  );
}
