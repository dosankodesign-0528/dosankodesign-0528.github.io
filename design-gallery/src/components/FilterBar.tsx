"use client";

import { useState, useRef, useEffect } from "react";
import {
  SourceSite,
  SOURCE_LABELS,
  SOURCE_COLORS,
  FilterState,
} from "@/types";
import { allAgencies, dateRange as globalDateRange } from "@/data/load-sites";

interface FilterBarProps {
  filter: FilterState;
  updateFilter: (partial: Partial<FilterState>) => void;
  toggleSource: (source: SourceSite) => void;
  onClearSources: () => void;
  resetFilter: () => void;
}

const sources: SourceSite[] = ["sankou", "81web", "muuuuu", "awwwards"];

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

/** ドロップダウン */
function Dropdown({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
          open
            ? "border-accent text-accent bg-blue-50"
            : "border-border text-text-secondary hover:border-gray-300 hover:text-text-primary"
        }`}
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-[#2a2a2a] rounded-xl shadow-2xl border border-white/10 z-50 min-w-[220px] py-2 max-h-[320px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-[13px] transition-colors ${
        checked ? "text-white" : "text-white/60 hover:text-white/90"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-accent border-accent" : "border-white/30"
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function FilterBar({
  filter,
  updateFilter,
  toggleSource,
  onClearSources,
  resetFilter,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const allSourcesActive = filter.sources.length === 0;

  const allMonths = generateMonths(globalDateRange[0], globalDateRange[1]);
  const fromIdx = Math.max(0, allMonths.indexOf(filter.dateRange[0]));
  const toIdx = allMonths.indexOf(filter.dateRange[1]);
  const toIdxSafe = toIdx >= 0 ? toIdx : allMonths.length - 1;

  const hasActiveFilter =
    filter.sources.length > 0 ||
    filter.agencies.length > 0 ||
    filter.starredOnly ||
    filter.dateRange[0] !== globalDateRange[0] ||
    filter.dateRange[1] !== globalDateRange[1];

  const toggle = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-bg-secondary flex-wrap">
      {/* ソースタブ */}
      <button
        onClick={onClearSources}
        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          allSourcesActive
            ? "bg-text-primary text-white"
            : "text-text-secondary hover:bg-bg-primary"
        }`}
      >
        すべて
      </button>
      {sources.map((source) => {
        const active = filter.sources.includes(source);
        return (
          <button
            key={source}
            onClick={() => toggleSource(source)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
              active ? "text-white" : "text-text-secondary hover:bg-bg-primary"
            }`}
            style={active ? { backgroundColor: SOURCE_COLORS[source] } : {}}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SOURCE_COLORS[source] }}
            />
            {SOURCE_LABELS[source]}
          </button>
        );
      })}

      {/* 区切り */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* お気に入りフィルター */}
      <button
        onClick={() => updateFilter({ starredOnly: !filter.starredOnly })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          filter.starredOnly
            ? "bg-accent text-white"
            : "text-text-secondary hover:bg-bg-primary"
        }`}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill={filter.starredOnly ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        お気に入り
      </button>

      {/* エージェンシードロップダウン */}
      <Dropdown
        label={`Agency${filter.agencies.length > 0 ? ` (${filter.agencies.length})` : ""}`}
        open={openDropdown === "agency"}
        onToggle={() => toggle("agency")}
      >
        {allAgencies.map((a) => (
          <CheckItem
            key={a}
            label={a}
            checked={filter.agencies.includes(a)}
            onChange={() =>
              updateFilter({
                agencies: filter.agencies.includes(a)
                  ? filter.agencies.filter((x) => x !== a)
                  : [...filter.agencies, a],
              })
            }
          />
        ))}
      </Dropdown>

      {/* 日付ドロップダウン */}
      <Dropdown
        label={`Date`}
        open={openDropdown === "date"}
        onToggle={() => toggle("date")}
      >
        <div className="px-4 py-3 min-w-[260px]">
          <div className="text-[13px] text-white mb-3 font-medium">
            {filter.dateRange[0]} — {filter.dateRange[1]}
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-white/50 uppercase">From</label>
              <input
                type="range"
                min={0}
                max={allMonths.length - 1}
                value={fromIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const newFrom = allMonths[idx];
                  if (newFrom <= filter.dateRange[1]) {
                    updateFilter({ dateRange: [newFrom, filter.dateRange[1]] });
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 uppercase">To</label>
              <input
                type="range"
                min={0}
                max={allMonths.length - 1}
                value={toIdxSafe}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const newTo = allMonths[idx];
                  if (newTo >= filter.dateRange[0]) {
                    updateFilter({ dateRange: [filter.dateRange[0], newTo] });
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
            リセット
          </button>
        </div>
      </Dropdown>

      {/* リセット */}
      {hasActiveFilter && (
        <>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={resetFilter}
            className="text-[11px] text-accent hover:text-accent/80 transition-colors"
          >
            ✕ クリア
          </button>
        </>
      )}
    </div>
  );
}
