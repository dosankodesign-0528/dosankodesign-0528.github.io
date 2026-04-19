"use client";

import { useState } from "react";
import { FilterState, ViewMode } from "@/types";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  columns: number;
  onColumnsChange: (cols: number) => void;
  totalCount: number;
  filteredCount: number;
  filter: FilterState;
  updateFilter: (partial: Partial<FilterState>) => void;
}

const MODES: { id: "unchecked" | "all" | "checked"; label: string; dot: string }[] = [
  { id: "unchecked", label: "未確認", dot: "#EF4444" },
  { id: "all", label: "すべて", dot: "#6B7280" },
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
}: HeaderProps) {
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
      {/* ロゴ */}
      <h1 className="text-[15px] font-bold tracking-tight whitespace-nowrap text-text-primary">
        Design Gallery
      </h1>

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
          max={8}
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
