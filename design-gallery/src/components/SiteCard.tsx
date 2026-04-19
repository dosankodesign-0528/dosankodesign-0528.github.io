"use client";

import { memo, useState, useCallback } from "react";
import {
  SiteEntry,
  SOURCE_LABELS,
  SOURCE_COLORS,
} from "@/types";

interface SiteCardProps {
  site: SiteEntry;
  selected: boolean;
  onSelect: (id: string, e: { shiftKey: boolean; metaKey: boolean }) => void;
  onToggleStar: (id: string) => void;
}

export const SiteCard = memo(function SiteCard({
  site,
  selected,
  onSelect,
  onToggleStar,
}: SiteCardProps) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(site.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [site.url]
  );

  // URLのドメインだけ表示
  const displayUrl = (() => {
    try {
      return new URL(site.url).hostname.replace("www.", "");
    } catch {
      return site.url;
    }
  })();

  return (
    <div
      data-site-id={site.id}
      className={`group relative rounded-xl bg-bg-secondary transition-shadow duration-200 cursor-pointer ${
        selected ? "outline outline-2 outline-blue-500 outline-offset-2" : ""
      }`}
      style={{
        boxShadow: hovered
          ? "var(--card-shadow-hover)"
          : "var(--card-shadow)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => onSelect(site.id, { shiftKey: e.shiftKey, metaKey: e.metaKey })}
    >
      {/* サムネイル */}
      <div className="relative overflow-hidden bg-gray-100 rounded-t-xl aspect-[4/3]">
        <img
          src={site.thumbnailUrl}
          alt={site.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          draggable={false}
        />

        {/* ホバーオーバーレイ */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* DONEチェック（左上・常時うっすら表示） */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(site.id);
          }}
          className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            site.starred
              ? "bg-emerald-500 text-white shadow-md"
              : hovered
                ? "bg-white/90 text-gray-400 hover:bg-emerald-500 hover:text-white shadow-sm"
                : "bg-white/50 text-gray-300 shadow-sm"
          }`}
          title={site.starred ? "未確認に戻す" : "確認済みにする"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* 日付（ホバー時・左上チェックの右） */}
        <div
          className={`absolute top-3 left-12 text-[11px] font-medium text-white drop-shadow transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {site.date}
        </div>

        {/* 外部リンク（ホバー時・右上） */}
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          title="サイトを開く"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        {/* 引用元バッジ（右下） */}
        <div
          className={`absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-80"
          }`}
          style={{ backgroundColor: SOURCE_COLORS[site.source] }}
        >
          {SOURCE_LABELS[site.source]}
        </div>
      </div>

      {/* カード情報 */}
      <div className="px-3.5 py-3">
        <h3 className="text-[13px] font-semibold text-text-primary truncate leading-tight">
          {site.title}
        </h3>
        {site.agency && (
          <p className="text-[11px] text-text-secondary mt-0.5 truncate">
            {site.agency}
          </p>
        )}
        {/* URL + 日付 */}
        <div className="flex items-center gap-2 mt-1.5">
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-1 text-[11px] text-text-secondary/70 hover:text-accent transition-colors min-w-0"
          title="URLをコピー"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10"
              />
            )}
          </svg>
          <span className="truncate">
            {copied ? "コピーしました!" : displayUrl}
          </span>
        </button>
        <span className="text-[11px] text-text-secondary/50 shrink-0">{site.date}</span>
        </div>
      </div>
    </div>
  );
},
(prev, next) =>
  prev.site.id === next.site.id &&
  prev.site.starred === next.site.starred &&
  prev.site.date === next.site.date &&
  prev.selected === next.selected
);
