"use client";

import { useEffect } from "react";
import {
  FilterState,
  SortOrder,
  SiteSignal,
  SIGNAL_LABELS,
} from "@/types";
import { dateRange as globalDateRange } from "@/data/load-sites";

interface FilterModalProps {
  filter: FilterState;
  updateFilter: (partial: Partial<FilterState>) => void;
  onClose: () => void;
  /** 各シグナルが何件ヒットしているか（UIヒント表示用、省略可） */
  signalCounts?: Partial<Record<SiteSignal, number>>;
}

const SIGNAL_ORDER: SiteSignal[] = ["framer", "studio", "production"];

/** 日付レンジ用のYYYY-MM配列を生成 */
function generateMonths(from: string, to: string): string[] {
  const months: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy,
    m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

export function FilterModal({
  filter,
  updateFilter,
  onClose,
  signalCounts,
}: FilterModalProps) {
  // Escで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allMonths = generateMonths(globalDateRange[0], globalDateRange[1]);
  const fromIdx = Math.max(0, allMonths.indexOf(filter.dateRange[0]));
  const toIdx = allMonths.indexOf(filter.dateRange[1]);
  const toIdxSafe = toIdx >= 0 ? toIdx : allMonths.length - 1;

  const toggleSignal = (sig: SiteSignal) => {
    const has = filter.signals.includes(sig);
    const next = has
      ? filter.signals.filter((s) => s !== sig)
      : [...filter.signals, sig];
    updateFilter({ signals: next });
  };

  const resetAll = () => {
    updateFilter({
      sortOrder: "newest",
      dateRange: globalDateRange,
      signals: [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center gap-3 p-5 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-accent"
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
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold text-text-primary leading-tight">
              フィルター
            </h2>
            <p className="text-[12px] text-text-secondary mt-0.5">
              並び順・日付・タグ（Framer / スタジオ / プロダクション）
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors shrink-0"
            aria-label="閉じる"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 本体 */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* 並び順 */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-text-secondary mb-2">
              並び順
            </h3>
            <div className="flex gap-2">
              {(["newest", "oldest"] as SortOrder[]).map((order) => {
                const active = filter.sortOrder === order;
                return (
                  <button
                    key={order}
                    onClick={() => updateFilter({ sortOrder: order })}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                      active
                        ? "bg-text-primary text-white border-text-primary"
                        : "text-text-secondary border-border hover:border-text-primary/50"
                    }`}
                  >
                    {order === "newest" ? "↓ 新しい順" : "↑ 古い順"}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 日付 */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-text-secondary mb-2">
              日付レンジ
            </h3>
            <div className="text-[13px] text-text-primary font-medium mb-3">
              {filter.dateRange[0]} — {filter.dateRange[1]}
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-text-secondary uppercase">
                  From
                </label>
                <input
                  type="range"
                  min={0}
                  max={allMonths.length - 1}
                  value={fromIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    const newFrom = allMonths[idx];
                    if (newFrom <= filter.dateRange[1]) {
                      updateFilter({
                        dateRange: [newFrom, filter.dateRange[1]],
                      });
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-secondary uppercase">
                  To
                </label>
                <input
                  type="range"
                  min={0}
                  max={allMonths.length - 1}
                  value={toIdxSafe}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    const newTo = allMonths[idx];
                    if (newTo >= filter.dateRange[0]) {
                      updateFilter({
                        dateRange: [filter.dateRange[0], newTo],
                      });
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
            <button
              onClick={() => updateFilter({ dateRange: globalDateRange })}
              className="mt-2 text-[11px] text-accent hover:text-accent/80"
            >
              日付をリセット
            </button>
          </section>

          {/* タグ（Framer / Studio / Production） */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-text-secondary mb-2">
              制作タグ（AND条件）
            </h3>
            <div className="flex flex-col gap-1.5">
              {SIGNAL_ORDER.map((sig) => {
                const checked = filter.signals.includes(sig);
                const count = signalCounts?.[sig];
                return (
                  <button
                    key={sig}
                    onClick={() => toggleSignal(sig)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      checked
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-text-primary/40"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? "bg-accent border-accent"
                          : "border-text-secondary/40"
                      }`}
                    >
                      {checked && (
                        <svg
                          className="w-3 h-3 text-white"
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
                    <span className="flex-1 text-[13px] text-text-primary">
                      {SIGNAL_LABELS[sig]}
                    </span>
                    {typeof count === "number" && (
                      <span className="text-[11px] text-text-secondary">
                        {count.toLocaleString()} 件
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
              ※ タグは HTML を自動解析して付与しています（Framer のメタ情報、タイトル中の &ldquo;Web制作&rdquo; /
              &ldquo;Studio&rdquo; などのキーワードを検出）。未検出の場合は 0 件表示になります。
            </p>
          </section>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-border shrink-0 flex items-center justify-between">
          <button
            onClick={resetAll}
            className="h-9 px-3 rounded-lg text-[12px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
          >
            すべてリセット
          </button>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-text-primary text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            適用して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
