"use client";

/**
 * Eagleトグル UX 検討モック。
 *
 * 構成:
 *  1. インタラクティブ実画面プレビュー — 各案A〜Fを現状のギャラリー画面に組み込んだ
 *     リアルなイメージで比較。Eagleトグルと案の切替がその場で出来る。
 *  2. 横並び比較 — OFF/ONを隣同士で見てレイアウトシフトの有無を確認。
 *  3. 推奨まとめ。
 *
 * スクロール: bodyレベルで縦スクロールが自然に効くようにしてある
 *  （h-screen/overflow-hiddenは使わない）。
 */

import { useState } from "react";

type VariantId = "A" | "B" | "C" | "D" | "E" | "F";

/* ========================================================
   共通UIパーツ（ヘッダー部品の再現）
   ======================================================== */
function ReloadBtn() {
  return (
    <button
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white"
      title="再読み込み"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
function ModeSeg() {
  return (
    <div className="inline-flex p-0.5 bg-white rounded-lg">
      {["未確認", "すべて", "確認済み"].map((l, i) => (
        <div
          key={l}
          className={`px-3 h-7 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 ${
            i === 0 ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i === 0 ? "#EF4444" : i === 1 ? "#6B7280" : "#10B981",
            }}
          />
          {l}
        </div>
      ))}
    </div>
  );
}
function Cols() {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="3" height="3" rx="0.5" />
        <rect x="6" y="1" width="3" height="3" rx="0.5" />
        <rect x="11" y="1" width="3" height="3" rx="0.5" />
        <rect x="1" y="6" width="3" height="3" rx="0.5" />
        <rect x="6" y="6" width="3" height="3" rx="0.5" />
        <rect x="11" y="6" width="3" height="3" rx="0.5" />
      </svg>
      <input
        type="range"
        className="w-[80px] accent-blue-500"
        defaultValue={4}
        min={2}
        max={8}
        readOnly
      />
    </div>
  );
}
function Search() {
  return (
    <div className="relative flex-1 max-w-[280px]">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        placeholder="サイト名、URL、エージェンシーで検索..."
        className="w-full h-8 pl-9 pr-3 text-[13px] bg-white border border-gray-200 rounded-lg"
      />
    </div>
  );
}
function Count({ on }: { on: boolean }) {
  // ON時は Eagle除外858件ぶんヒット数が減る想定
  return (
    <span className="text-[12px] text-gray-500 whitespace-nowrap">
      {on ? "3,905" : "4,763"} / 4,763 sites
    </span>
  );
}
function EagleIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`relative w-8 h-5 rounded-full transition-colors ${
        on ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          on ? "left-[14px]" : "left-0.5"
        }`}
      />
    </div>
  );
}
function StatusDot() {
  return <span className="w-2 h-2 rounded-full bg-emerald-500" />;
}

/* ========================================================
   バリエーション（ヘッダー右クラスタ）
   ======================================================== */

/** A. 現行 — チップが後から追加され、右側が左にずれる */
function VariantA({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      {on && (
        <button className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-600 text-[12px] font-medium">
          <EagleIcon />
          858 件非表示中
        </button>
      )}
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** B. 固定プレースホルダ — チップ枠は常に存在、OFF時は透明扱い */
function VariantB({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      <button
        className={`h-8 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
          on
            ? "border-blue-300 bg-blue-50 text-blue-600"
            : "border-transparent text-transparent pointer-events-none select-none"
        }`}
      >
        <EagleIcon />
        858 件非表示中
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** C. ピル内カウント統合 */
function VariantC({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        {on && (
          <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded-full bg-white border border-blue-200 text-blue-600 text-[11px] font-medium tabular-nums">
            <EagleIcon className="w-3 h-3" />
            858
          </span>
        )}
        <Toggle on={on} />
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** D. アイコン+バッジのみ — テキスト無し */
function VariantD({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      <button
        className={`relative w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${
          on ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed"
        }`}
        disabled={!on}
      >
        <EagleIcon className="w-4 h-4" />
        {on && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold inline-flex items-center justify-center tabular-nums">
            858
          </span>
        )}
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** E. セカンダリバー版(右クラスタ単体) — ヘッダー内は常に不動 */
function VariantE({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-1 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-1 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <Toggle on={on} />
      </div>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

/** F. トグル自体にカウントを内包 */
function VariantF({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className={`h-8 inline-flex items-center gap-2 pl-2 pr-2 rounded-lg border transition-colors ${
          on ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
          <StatusDot />
          <span className="font-medium">Eagle</span>
        </div>
        <span className="w-px h-4 bg-gray-200" />
        <span
          className={`text-[11px] tabular-nums min-w-[56px] text-right ${
            on ? "text-blue-600 font-semibold" : "text-gray-400"
          }`}
        >
          {on ? "858件" : "全件表示"}
        </span>
        <Toggle on={on} />
      </button>
      <ReloadBtn />
      <ModeSeg />
      <Cols />
    </div>
  );
}

const VARIANTS: Record<
  VariantId,
  {
    label: string;
    tldr: string;
    Component: React.FC<{ on: boolean }>;
    recommended?: boolean;
  }
> = {
  A: {
    label: "現行（問題あり）",
    tldr: "ON時にチップが追加され、右側が左にずれる。",
    Component: VariantA,
  },
  B: {
    label: "固定スペース確保",
    tldr: "チップ枠を常に存在させ、OFF時は透明にする。",
    Component: VariantB,
    recommended: true,
  },
  C: {
    label: "ピル内統合",
    tldr: "件数バッジを Eagle ピルの中に入れる。",
    Component: VariantC,
  },
  D: {
    label: "アイコン＋バッジ",
    tldr: "件数はバッジ数字のみ、テキスト無しで超コンパクト。",
    Component: VariantD,
  },
  E: {
    label: "セカンダリバー",
    tldr: "ヘッダー下に別行でチップを出す。ヘッダー内は不動。",
    Component: VariantE,
  },
  F: {
    label: "トグル内カウント内包",
    tldr: "Eagle ピル自体に件数を固定幅で内包。",
    Component: VariantF,
  },
};

/* ========================================================
   サンプルギャラリー（実画面イメージ用の疑似カード）
   ======================================================== */
const SAMPLE_THUMBS = [
  "linear-gradient(135deg,#F3D3BD 0%,#E97C6B 100%)",
  "linear-gradient(135deg,#2E2E38 0%,#0F1021 100%)",
  "linear-gradient(135deg,#FFD93D 0%,#FF6B6B 100%)",
  "linear-gradient(135deg,#A8E6CF 0%,#3D84A8 100%)",
  "linear-gradient(135deg,#FCE38A 0%,#F38181 100%)",
  "linear-gradient(135deg,#95E1D3 0%,#38ADA9 100%)",
  "linear-gradient(135deg,#EAFFD0 0%,#6B5B95 100%)",
  "linear-gradient(135deg,#F8B195 0%,#C06C84 100%)",
  "linear-gradient(135deg,#D9A7C7 0%,#FFFCDC 100%)",
  "linear-gradient(135deg,#B8B5FF 0%,#7579E7 100%)",
  "linear-gradient(135deg,#FDEB71 0%,#F8D800 100%)",
  "linear-gradient(135deg,#E0C3FC 0%,#8EC5FC 100%)",
];
const SAMPLE_SOURCES: { label: string; color: string }[] = [
  { label: "SANKOU!", color: "#E85D75" },
  { label: "MUUUUU.ORG", color: "#2ECC71" },
  { label: "Web Design Clip", color: "#9B59B6" },
  { label: "81-web.com", color: "#4A90D9" },
];
const SAMPLE_TITLES = [
  "株式会社ブルーパッション",
  "tokyo minimal studio",
  "YURAGI ブランドサイト",
  "Slow Life Magazine",
  "Awaji Food Collective",
  "紫陽花の季節に",
  "Niigata Design Fair",
  "Forest & River Co.",
  "Kyoto Craft Works",
  "HOSHI Architects",
  "Urban Harvest",
  "Monochrome Press",
];

function SampleCard({ i }: { i: number }) {
  const src = SAMPLE_SOURCES[i % SAMPLE_SOURCES.length];
  return (
    <div className="rounded-lg overflow-hidden bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div
        className="aspect-[4/3] relative"
        style={{ background: SAMPLE_THUMBS[i % SAMPLE_THUMBS.length] }}
      >
        <span
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
          style={{ background: src.color }}
        >
          {src.label}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[12px] font-medium text-gray-900 truncate">
          {SAMPLE_TITLES[i % SAMPLE_TITLES.length]}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">2025-10</div>
      </div>
    </div>
  );
}

function SampleFilterBar() {
  return (
    <div className="h-[48px] bg-white border-b border-gray-200 flex items-center px-5 gap-2 text-[12px]">
      <div className="inline-flex gap-1">
        {SAMPLE_SOURCES.map((s) => (
          <button
            key={s.label}
            className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-gray-600 inline-flex items-center gap-1.5"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-gray-600">
        ★ チェック済み
      </button>
      <button className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-gray-600">
        エージェンシー
      </button>
      <button className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-gray-600">
        日付
      </button>
      <button className="h-7 px-2.5 rounded-md bg-white text-gray-400 ml-auto">
        並び順: 新しい順 ▾
      </button>
    </div>
  );
}

/* ========================================================
   実画面プレビュー（ヘッダー＋FilterBar＋Gallery）
   ======================================================== */
function FullPreview({
  variant,
  on,
}: {
  variant: VariantId;
  on: boolean;
}) {
  const { Component } = VARIANTS[variant];
  const isSecondary = variant === "E";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-300 bg-gray-50 shadow-sm">
      {/* Header */}
      <div className="h-[56px] bg-white border-b border-gray-200 flex items-center px-5 gap-4">
        <Search />
        <Count on={on} />
        <div className="ml-auto">
          <Component on={on} />
        </div>
      </div>

      {/* 案E: セカンダリバーで件数表示 */}
      {isSecondary && (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            on ? "h-10 opacity-100" : "h-0 opacity-0"
          }`}
        >
          <div className="h-10 flex items-center px-5 gap-3 bg-blue-50/70 border-b border-blue-100 text-[12px]">
            <EagleIcon className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-blue-700 font-medium">
              Eagle重複 858件を非表示中
            </span>
            <button className="text-blue-600 underline">一覧を見る</button>
          </div>
        </div>
      )}

      {/* FilterBar */}
      <SampleFilterBar />

      {/* Gallery */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-gray-50">
        {Array.from({ length: 12 }).map((_, i) => (
          <SampleCard key={i} i={i} />
        ))}
      </div>
    </div>
  );
}

/* ========================================================
   インタラクティブ実画面セクション
   ======================================================== */
function InteractivePreviewSection() {
  const [variant, setVariant] = useState<VariantId>("B");
  const [on, setOn] = useState(false);

  const v = VARIANTS[variant];

  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-gray-900">
            1. 実画面プレビュー（インタラクティブ）
          </h2>
          <p className="text-[13px] text-gray-600 mt-1">
            案と Eagle トグルを切替して、実際のギャラリー画面に組み込んだ時の見え方・レイアウトシフトの有無を検証できる。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[12px] text-gray-500">Eagleトグル:</label>
          <button
            onClick={() => setOn((v) => !v)}
            className={`h-9 px-4 rounded-lg text-[12px] font-semibold transition-colors ${
              on
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {on ? "ON (断捨離モード)" : "OFF"}
          </button>
        </div>
      </div>

      {/* Variant tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(VARIANTS) as VariantId[]).map((id) => {
          const active = id === variant;
          const vx = VARIANTS[id];
          return (
            <button
              key={id}
              onClick={() => setVariant(id)}
              className={`h-9 pl-2 pr-3 rounded-lg inline-flex items-center gap-2 text-[12px] border transition-colors ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-6 h-6 rounded inline-flex items-center justify-center font-bold ${
                  active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {id}
              </span>
              <span className="font-medium">{vx.label}</span>
              {vx.recommended && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  おすすめ
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-3 text-[12px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <b>案{variant}:</b> {v.tldr}
      </div>

      {/* 実画面プレビュー */}
      <FullPreview variant={variant} on={on} />

      {/* 二画面同時比較（OFF/ON） */}
      <div className="mt-6">
        <div className="mb-2 text-[12px] font-semibold text-gray-500">
          OFF/ON を同時に並べて比較（右側のガタつきを目視チェック）
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              OFF
            </div>
            <FullPreview variant={variant} on={false} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              ON
            </div>
            <FullPreview variant={variant} on={true} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================
   横並び比較カード（右クラスタのみ）
   ======================================================== */
interface VariantFrameProps {
  id: VariantId;
  pros: string[];
  cons: string[];
}
function VariantFrame({ id, pros, cons }: VariantFrameProps) {
  const { label, tldr, Component, recommended } = VARIANTS[id];
  return (
    <section className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <header className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-semibold inline-flex items-center justify-center shrink-0">
          {id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-gray-900">{label}</h3>
            {recommended && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                おすすめ
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5">{tldr}</p>
        </div>
      </header>

      <div className="p-5 space-y-3 bg-gray-50/50">
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            OFF
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 h-[56px] flex items-center justify-end overflow-x-auto">
            <Component on={false} />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            ON（Eagle重複を隠す）
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 h-[56px] flex items-center justify-end overflow-x-auto">
            <Component on={true} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
        <div className="p-4 border-r border-gray-100">
          <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-2">
            Pros
          </h4>
          <ul className="space-y-1">
            {pros.map((p, i) => (
              <li key={i} className="text-[12px] text-gray-700 flex gap-1.5">
                <span className="text-emerald-500">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-wide mb-2">
            Cons
          </h4>
          <ul className="space-y-1">
            {cons.map((c, i) => (
              <li key={i} className="text-[12px] text-gray-700 flex gap-1.5">
                <span className="text-rose-400">–</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ========================================================
   Page
   ======================================================== */
export default function Page() {
  return (
    <main
      className="min-h-screen bg-gray-100 py-10"
      // bodyレベルで自然スクロール。親でh-screen/overflow制限しない
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Eagleトグル 切替時レイアウトシフト改善案
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            現状、Eagle トグルを ON にすると「〇件非表示中」チップが突如現れてヘッダー右側が左にずれる。
            <br />
            6案を、<b>実画面プレビュー（上）と右クラスタ単体比較（下）</b>の 2 視点で検証できるようにした。
          </p>
        </div>

        {/* 1. インタラクティブ実画面プレビュー */}
        <InteractivePreviewSection />

        {/* 2. 横並び比較 */}
        <div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">
            2. 右クラスタのみ静的比較（OFF / ON）
          </h2>
          <p className="text-[13px] text-gray-600 mb-4">
            各案のヘッダー右側だけを切り出して、OFF/ONを並べた。レイアウトが動くかどうかがスパッと分かる。
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariantFrame
              id="A"
              pros={["実装シンプル", "情報量豊富"]}
              cons={[
                "切替時にガタつく（ユーザビリティ問題）",
                "右側要素の位置が変わるので目が追いづらい",
              ]}
            />
            <VariantFrame
              id="B"
              pros={[
                "レイアウトが1ミリも動かない",
                "ON化したときに視線誘導がスムーズ",
                "実装もシンプル",
              ]}
              cons={["OFF時に余白がちょっと不自然（情報密度の無駄）"]}
            />
            <VariantFrame
              id="C"
              pros={[
                "1つの関連情報として凝集している",
                "情報と操作が同じピル内で完結",
              ]}
              cons={[
                "ピル全体の幅がON/OFFで変わる → 他要素は少しずれる",
                "トグル/モーダルの用途が曖昧になりがち",
              ]}
            />
            <VariantFrame
              id="D"
              pros={[
                "超コンパクト、レイアウト完全固定",
                "通知感があり気づきやすい",
              ]}
              cons={[
                "「何の件数か」が初見で分かりにくい（要ツールチップ）",
                "役割がEagleピルと分離して混乱の可能性",
              ]}
            />
            <VariantFrame
              id="E"
              pros={[
                "ヘッダー内のレイアウトは一切動かない",
                "情報量豊富（件数・案内・ボタン）",
                "通常OFFで邪魔にならない",
              ]}
              cons={[
                "縦方向にコンテンツ領域が1行削られる",
                "画面全体の縦スクロール位置がズレる",
              ]}
            />
            <VariantFrame
              id="F"
              pros={[
                "ピル幅が常に一定（min-width固定）",
                "ON/OFFで状態が明確に切り替わる",
                "情報が1ピルに凝集",
              ]}
              cons={[
                "ピル自体がやや横長になる",
                "『一覧を見る』動線が弱い",
              ]}
            />
          </div>
        </div>

        <div className="mt-10 p-5 rounded-xl bg-white border border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">個人的な推し</h2>
          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
            <b className="text-gray-900">B（固定スペース確保）</b> が最も無難で実装コスト低い。
            <br />
            情報性と見た目のリッチさを両立したいなら{" "}
            <b className="text-gray-900">E（セカンダリバー）</b>。OFF時は完全に消えるが、ON時は
            「一覧を見る」動線と件数が同居できる。
            <br />
            コンパクトさ最優先なら{" "}
            <b className="text-gray-900">F（ピル内統合 + min-width）</b>。
          </p>
          <p className="text-[12px] text-gray-500 mt-3">
            上の「1. 実画面プレビュー」で A〜F を切替しながらお好みの案を教えてもらえれば、本番ヘッダーに反映します。
          </p>
        </div>
      </div>
    </main>
  );
}
