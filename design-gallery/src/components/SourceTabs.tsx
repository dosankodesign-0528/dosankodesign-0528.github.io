"use client";

import { SourceSite, SOURCE_LABELS, SOURCE_COLORS } from "@/types";

interface SourceTabsProps {
  activeSources: SourceSite[];
  onToggle: (source: SourceSite) => void;
  onClearSources: () => void;
}

const sources: SourceSite[] = ["sankou", "81web", "muuuuu", "webdesignclip", "awwwards"];

export function SourceTabs({
  activeSources,
  onToggle,
  onClearSources,
}: SourceTabsProps) {
  const allActive = activeSources.length === 0;

  return (
    <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border bg-bg-secondary">
      {/* 全て */}
      <button
        onClick={onClearSources}
        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          allActive
            ? "bg-text-primary text-white"
            : "text-text-secondary hover:bg-bg-primary"
        }`}
      >
        すべて
      </button>

      {/* 各ソース */}
      {sources.map((source) => {
        const active = activeSources.includes(source);
        return (
          <button
            key={source}
            onClick={() => onToggle(source)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
              active
                ? "text-white"
                : "text-text-secondary hover:bg-bg-primary"
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
    </div>
  );
}
