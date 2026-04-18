"use client";

import { useState } from "react";

type Source = "sankou" | "81web" | "muuuuu" | "webdesignclip";
type ViewMode = "unchecked" | "all" | "checked";

const SOURCE_LABELS: Record<Source, string> = {
  sankou: "SANKOU!",
  "81web": "81-web.com",
  muuuuu: "MUUUUU.ORG",
  webdesignclip: "Web Design Clip",
};
const SOURCE_COLORS: Record<Source, string> = {
  sankou: "#E85D75",
  "81web": "#4A90D9",
  muuuuu: "#2ECC71",
  webdesignclip: "#9B59B6",
};
const SOURCES: Source[] = ["sankou", "81web", "muuuuu", "webdesignclip"];

function useFilterState() {
  const [viewMode, setViewMode] = useState<ViewMode>("unchecked");
  const [sources, setSources] = useState<Source[]>([]);
  const toggleSource = (s: Source) =>
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const clearSources = () => setSources([]);
  return { viewMode, setViewMode, sources, toggleSource, clearSources };
}

// ============================================================
// 案A: セグメントコントロール（連結）+ ブランドピル
// ============================================================
function PatternA() {
  const { viewMode, setViewMode, sources, toggleSource, clearSources } =
    useFilterState();
  const modes: { id: ViewMode; label: string }[] = [
    { id: "unchecked", label: "未確認" },
    { id: "all", label: "すべて" },
    { id: "checked", label: "確認済み" },
  ];

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-lg border border-gray-200">
      {/* 左: セグメントコントロール（連結した3択） */}
      <div className="inline-flex p-0.5 bg-gray-100 rounded-lg">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            className={`px-3.5 py-1 rounded-md text-[12px] font-medium transition-all ${
              viewMode === m.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* 右: ブランド色のフィルターピル */}
      <button
        onClick={clearSources}
        className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${
          sources.length === 0
            ? "bg-gray-900 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        すべて
      </button>
      {SOURCES.map((s) => {
        const active = sources.includes(s);
        return (
          <button
            key={s}
            onClick={() => toggleSource(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              backgroundColor: active ? SOURCE_COLORS[s] : "transparent",
              color: active ? "white" : "#6b7280",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SOURCE_COLORS[s] }}
            />
            {SOURCE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// 案B: グループラベル + 囲い枠で視覚的に分離
// ============================================================
function PatternB() {
  const { viewMode, setViewMode, sources, toggleSource, clearSources } =
    useFilterState();
  const modes: { id: ViewMode; label: string }[] = [
    { id: "unchecked", label: "未確認" },
    { id: "all", label: "すべて" },
    { id: "checked", label: "確認済み" },
  ];

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-lg border border-gray-200">
      {/* 左: 状態グループ */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          状態
        </span>
        <div className="flex items-center gap-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${
                viewMode === m.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* 右: メディアグループ（囲い枠付き） */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          メディア
        </span>
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
          <button
            onClick={clearSources}
            className={`px-2.5 py-1 rounded-md text-[12px] font-medium ${
              sources.length === 0
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            全て
          </button>
          {SOURCES.map((s) => {
            const active = sources.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSource(s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                  active
                    ? "bg-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                style={active ? { color: SOURCE_COLORS[s] } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[s] }}
                />
                {SOURCE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 案C: ラジオ/チェックボックスアイコンで単一/複数選択を明示
// ============================================================
function PatternC() {
  const { viewMode, setViewMode, sources, toggleSource, clearSources } =
    useFilterState();
  const modes: { id: ViewMode; label: string; icon: string }[] = [
    { id: "unchecked", label: "未確認", icon: "●" },
    { id: "all", label: "すべて", icon: "◉" },
    { id: "checked", label: "確認済み", icon: "✓" },
  ];

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-lg border border-gray-200">
      {/* 左: ラジオ風（1つだけ選べる） */}
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              viewMode === m.id
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                viewMode === m.id ? "border-white" : "border-gray-400"
              }`}
            >
              {viewMode === m.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* 右: チェックボックス風（複数選べる） */}
      <button
        onClick={clearSources}
        className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${
          sources.length === 0
            ? "bg-gray-200 text-gray-900"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        すべて
      </button>
      {SOURCES.map((s) => {
        const active = sources.includes(s);
        return (
          <button
            key={s}
            onClick={() => toggleSource(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
              active
                ? "text-white border-transparent"
                : "text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
            style={active ? { backgroundColor: SOURCE_COLORS[s] } : {}}
          >
            <span
              className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                active ? "bg-white border-white" : "border-gray-400"
              }`}
            >
              {active && (
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: SOURCE_COLORS[s] }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            {SOURCE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// 案D: アンダーラインタブ + カラードットのチップ
// ============================================================
function PatternD() {
  const { viewMode, setViewMode, sources, toggleSource, clearSources } =
    useFilterState();
  const modes: { id: ViewMode; label: string; count?: number }[] = [
    { id: "unchecked", label: "未確認", count: 342 },
    { id: "all", label: "すべて", count: 3569 },
    { id: "checked", label: "確認済み", count: 127 },
  ];

  return (
    <div className="flex items-center gap-4 px-5 bg-white rounded-lg border border-gray-200">
      {/* 左: アンダーラインタブ */}
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            className={`relative px-3 py-3.5 text-[13px] font-medium transition-colors ${
              viewMode === m.id
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {m.label}
            <span className="ml-1.5 text-[11px] text-gray-400">
              {m.count}
            </span>
            {viewMode === m.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* 右: カラードット付きのサイズ違いチップ */}
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={clearSources}
          className={`text-[12px] font-medium ${
            sources.length === 0
              ? "text-gray-900"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          全メディア
        </button>
        <span className="text-gray-300">·</span>
        {SOURCES.map((s) => {
          const active = sources.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleSource(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: SOURCE_COLORS[s],
                  opacity: active ? 1 : 0.4,
                }}
              />
              {SOURCE_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 案E: 状態は左固定のトグル + メディアは折り畳みドロップダウン
// ============================================================
function PatternE() {
  const { viewMode, setViewMode, sources, toggleSource, clearSources } =
    useFilterState();
  const [open, setOpen] = useState(false);
  const modes: { id: ViewMode; label: string }[] = [
    { id: "unchecked", label: "未確認のみ" },
    { id: "all", label: "全て" },
    { id: "checked", label: "確認済み" },
  ];

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-lg border border-gray-200">
      {/* 左: iOSライクな連結トグル */}
      <div className="inline-flex border border-gray-300 rounded-full overflow-hidden">
        {modes.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            className={`px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              viewMode === m.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            } ${i > 0 ? "border-l border-gray-300" : ""}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* 右: ドロップダウンで折り畳み */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
            sources.length > 0
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-gray-300 text-gray-600 hover:border-gray-400"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          メディア
          {sources.length > 0 && (
            <span className="flex items-center gap-0.5">
              {sources.map((s) => (
                <span
                  key={s}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[s] }}
                />
              ))}
            </span>
          )}
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[200px] py-2">
            <button
              onClick={clearSources}
              className="w-full text-left px-4 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50"
            >
              選択をクリア
            </button>
            <div className="h-px bg-gray-100 my-1" />
            {SOURCES.map((s) => {
              const active = sources.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className="w-full flex items-center gap-2.5 px-4 py-1.5 text-[13px] hover:bg-gray-50"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      active
                        ? "border-transparent"
                        : "border-gray-300"
                    }`}
                    style={
                      active
                        ? { backgroundColor: SOURCE_COLORS[s] }
                        : {}
                    }
                  >
                    {active && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: SOURCE_COLORS[s] }}
                  />
                  <span className="text-gray-800">{SOURCE_LABELS[s]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ページ
// ============================================================
export default function MockPage() {
  const patterns = [
    {
      id: "A",
      title: "A. セグメントコントロール + ブランドピル",
      desc: "左は iOS 風の連結セグメント（箱型）、右はブランド色の丸ピル。形で役割を分けるシンプル案。",
      Component: PatternA,
    },
    {
      id: "B",
      title: "B. グループラベル + 囲い枠",
      desc: "「状態」「メディア」の小見出しで用途を明示。メディア側は薄い枠で囲って一つのかたまりに見せる。",
      Component: PatternB,
    },
    {
      id: "C",
      title: "C. ラジオ/チェックボックス表示",
      desc: "左にラジオボタン、右にチェックボックスを描画。単一選択 vs 複数選択の違いが一目で分かる。",
      Component: PatternC,
    },
    {
      id: "D",
      title: "D. アンダーラインタブ + ソフトチップ",
      desc: "左を件数付きのタブ UI に昇格。右はやわらかめのチップでフィルター補助の位置付けを示す。",
      Component: PatternD,
    },
    {
      id: "E",
      title: "E. トグル + メディアドロップダウン",
      desc: "状態は常時トグルで即切替。メディアは折り畳み、選択中は色ドットでプレビュー。省スペース派。",
      Component: PatternE,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          フィルターバー UI 案
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          左グループ「状態」（3択・単一選択）と、右グループ「メディア」（複数選択）を視覚的に区別する5案。Awwwards は全案で削除済み。
        </p>

        <div className="space-y-10">
          {patterns.map(({ id, title, desc, Component }) => (
            <section key={id}>
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  {title}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
              <div className="overflow-x-auto">
                <Component />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
