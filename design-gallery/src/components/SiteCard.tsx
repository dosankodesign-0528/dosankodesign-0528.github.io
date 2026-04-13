"use client";

import { useState, useCallback } from "react";
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
  layout: "grid" | "waterfall";
}

export function SiteCard({
  site,
  selected,
  onSelect,
  onToggleStar,
  layout,
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
      className={`group relative rounded-xl overflow-hidden bg-bg-secondary transition-all duration-200 cursor-pointer ${
        selected ? "card-selected" : ""
      } ${layout === "waterfall" ? "break-inside-avoid mb-4" : ""}`}
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
      <div
        className={`relative overflow-hidden bg-gray-100 ${
          layout === "waterfall" ? "" : "aspect-[4/3]"
        }`}
      >
        <img
          src={site.thumbnailUrl}
          alt={site.title}
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
            layout === "waterfall"
              ? "object-top"
              : "h-full"
          }`}
          loading="lazy"
        />

        {/* ホバーオーバーレイ */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

        {/* 日付（左上） */}
        <div
          className={`absolute top-3 left-3 text-[11px] font-medium text-white transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {site.date}
        </div>

        {/* ホバーアクション（右上） */}
        <div
          className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 transition-opacity duration-200 ${
            hovered || site.starred ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* ブックマーク（しおり） */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(site.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              site.starred
                ? "bg-white text-accent"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
            title={site.starred ? "お気に入り解除" : "お気に入りに追加"}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={site.starred ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={site.starred ? 0 : 2}
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          {/* 外部リンク */}
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            title="サイトを開く"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* 引用元バッジ */}
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
        {/* URLコピーボタン */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center gap-1 mt-1.5 text-[11px] text-text-secondary/70 hover:text-accent transition-colors group/url"
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
      </div>
    </div>
  );
}
