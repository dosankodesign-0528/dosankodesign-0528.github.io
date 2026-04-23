"use client";

import { useState } from "react";
import { FilterState, ViewMode } from "@/types";
import type { EagleStatus } from "@/hooks/useEagleSync";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  columns: number;
  onColumnsChange: (cols: number) => void;
  totalCount: number;
  filteredCount: number;
  filter: FilterState;
  updateFilter: (partial: Partial<FilterState>) => void;
  // Eagle連携
  eagleStatus: EagleStatus;
  eagleLastSyncAt: string | null;
  eagleItemCount: number;
  onEagleRefresh: () => void;
  // Eagle重複の表示/非表示トグル
  hideEagleDuplicates: boolean;
  onToggleHideEagleDuplicates: () => void;
  // 確認済みリセット
  starredCount: number;
  onClearAllStarred: () => void;
}

/** ISO → 「〇分前 / 〇時間前 / 〇日前」 */
function formatRelativeTime(iso: string | null): string {
  if (!iso) return "未同期";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "たった今";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}

// 並び順は「すべて → 未確認 → 確認済み」。
// デフォルト(initialFilter.viewMode="unchecked") が真ん中に来るので、
// 左右に広げて選べる感覚になりやすい。
const MODES: { id: "all" | "unchecked" | "checked"; label: string; dot: string }[] = [
  { id: "all", label: "すべて", dot: "#6B7280" },
  { id: "unchecked", label: "未確認", dot: "#EF4444" },
  { id: "checked", label: "確認済み", dot: "#10B981" },
];

export function Header({
  search,
  onSearchChange,
  columns,
  onColumnsChange,
  totalCount,
  filteredCount,
  filter,
  updateFilter,
  eagleStatus,
  eagleLastSyncAt,
  eagleItemCount,
  onEagleRefresh,
  hideEagleDuplicates,
  onToggleHideEagleDuplicates,
  starredCount,
  onClearAllStarred,
}: HeaderProps) {
  void onEagleRefresh; // Eagleの再取得はリロードボタン経由（ページ全体リロード）に集約
  // Eagleステータスの見せ方
  const eagleDotColor =
    eagleStatus === "live"
      ? "#10B981" // 緑: 起動中
      : eagleStatus === "cached"
        ? "#F59E0B" // オレンジ: キャッシュ使用中
        : eagleStatus === "syncing"
          ? "#3B82F6" // 青: 同期中
          : "#9CA3AF"; // グレー: 未接続/なし

  const eagleStatusText =
    eagleStatus === "live"
      ? `Eagle接続中（${eagleItemCount}件）`
      : eagleStatus === "cached"
        ? `キャッシュ使用中・${formatRelativeTime(eagleLastSyncAt)}に同期（${eagleItemCount}件）`
        : eagleStatus === "syncing"
          ? "Eagle同期中…"
          : eagleStatus === "empty"
            ? "Eagle未接続（起動してリロードで連携）"
            : "Eagle未同期";
  const viewModeState: "unchecked" | "all" | "checked" = filter.starredOnly
    ? "checked"
    : filter.viewMode === "unchecked"
      ? "unchecked"
      : "all";

  const setMode = (id: "unchecked" | "all" | "checked") => {
    if (id === "checked") {
      updateFilter({ viewMode: "all" as ViewMode, starredOnly: true });
    } else {
      updateFilter({ viewMode: id as ViewMode, starredOnly: false });
    }
  };

  const [isReloading, setIsReloading] = useState(false);
  const handleReload = () => {
    if (isReloading) return;
    setIsReloading(true);
    // スピンが見える程度に少しだけ待ってからリロード
    window.setTimeout(() => window.location.reload(), 280);
  };

  return (
    <header className="h-[56px] bg-bg-secondary border-b border-border flex items-center px-5 gap-4 shrink-0 z-30">
      {/* 検索 */}
      <div className="relative flex-1 max-w-[400px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="サイト名、URL、エージェンシーで検索..."
          className="w-full h-8 pl-9 pr-3 text-[13px] bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {/* 件数 */}
      <span className="text-[12px] text-text-secondary whitespace-nowrap">
        {filteredCount === totalCount
          ? `${totalCount} sites`
          : `${filteredCount} / ${totalCount} sites`}
      </span>

      {/* スペーサー */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Eagle連携ステータス + 重複非表示トグル（クリックでON/OFF切替） */}
        <button
          onClick={onToggleHideEagleDuplicates}
          className={`h-8 inline-flex items-center gap-2 px-2.5 rounded-lg border text-[12px] transition-colors ${
            hideEagleDuplicates
              ? "border-accent/50 bg-accent/10 text-accent hover:bg-accent/15"
              : "border-border bg-bg-primary text-text-secondary hover:text-text-primary hover:border-accent/40"
          }`}
          title={`${eagleStatusText}\nクリックでEagle重複の${hideEagleDuplicates ? "表示" : "非表示"}を切替`}
          aria-label={`Eagle重複の表示切替 - 現在${hideEagleDuplicates ? "非表示" : "表示"}中`}
          aria-pressed={hideEagleDuplicates}
        >
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              eagleStatus === "syncing" ? "animate-pulse" : ""
            }`}
            style={{ backgroundColor: eagleDotColor }}
          />
          <span className="font-medium">Eagle</span>
          {/* ミニトグルスイッチ */}
          <span
            className={`relative w-6 h-3.5 rounded-full transition-colors ${
              hideEagleDuplicates ? "bg-accent" : "bg-border"
            }`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform ${
                hideEagleDuplicates ? "translate-x-[13px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        {/* 手動リロード */}
        <button
          onClick={handleReload}
          disabled={isReloading}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isReloading
              ? "text-accent bg-bg-primary cursor-wait"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-primary"
          }`}
          title="最新のデータを読み込み直す"
          aria-label="最新のデータを読み込み直す"
        >
          <svg
            className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* 確認済みリセット（確認済みが1件以上ある時だけ出す） */}
        {starredCount > 0 && (
          <button
            onClick={() => {
              const ok = window.confirm(
                `確認済みの${starredCount}件をすべて未確認に戻します。よろしいですか？`
              );
              if (ok) onClearAllStarred();
            }}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-bg-primary text-[12px] text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
            title={`確認済みの${starredCount}件を一括で未確認に戻す`}
            aria-label="確認済みを一括リセット"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="tabular-nums">{starredCount}</span>
          </button>
        )}

        {/* 状態セグメント（V02: 状態ドット付き） */}
        <div className="inline-flex p-0.5 bg-bg-primary rounded-lg">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 h-7 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-all ${
                viewModeState === m.id
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列数スライダー */}
      <div className="flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-text-secondary"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="1" y="1" width="3" height="3" rx="0.5" />
          <rect x="6" y="1" width="3" height="3" rx="0.5" />
          <rect x="11" y="1" width="3" height="3" rx="0.5" />
          <rect x="1" y="6" width="3" height="3" rx="0.5" />
          <rect x="6" y="6" width="3" height="3" rx="0.5" />
          <rect x="11" y="6" width="3" height="3" rx="0.5" />
        </svg>
        <input
          type="range"
          min={2}
          max={10}
          value={columns}
          onChange={(e) => onColumnsChange(Number(e.target.value))}
          className="w-[80px] accent-accent"
          title={`${columns}列`}
        />
        <svg
          className="w-3 h-3 text-text-secondary"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <rect x="1" y="1" width="6" height="6" rx="0.5" />
          <rect x="9" y="1" width="6" height="6" rx="0.5" />
          <rect x="1" y="9" width="6" height="6" rx="0.5" />
          <rect x="9" y="9" width="6" height="6" rx="0.5" />
        </svg>
      </div>
    </header>
  );
}
