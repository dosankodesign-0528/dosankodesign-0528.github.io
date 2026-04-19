"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { SiteEntry } from "@/types";
import { SiteCard } from "./SiteCard";

const PAGE_SIZE = 100;

interface GalleryProps {
  sites: SiteEntry[];
  columns: number;
  selectedIds: Set<string>;
  onSelect: (id: string, e: { shiftKey: boolean; metaKey: boolean }) => void;
  onToggleStar: (id: string) => void;
  onSetStarredMany: (ids: string[], starred: boolean) => void;
  onClearSelection: () => void;
  onColumnsChange: (cols: number) => void;
}

export function Gallery({
  sites,
  columns,
  selectedIds,
  onSelect,
  onToggleStar,
  onSetStarredMany,
  onClearSelection,
  onColumnsChange,
}: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // フィルターが変わったらdisplayCountをリセット
  const sitesKey = sites.length;
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    // スクロール位置もリセット
    containerRef.current?.scrollTo(0, 0);
  }, [sitesKey]);

  // 表示するサイト
  const visibleSites = useMemo(
    () => sites.slice(0, displayCount),
    [sites, displayCount]
  );
  const hasMore = displayCount < sites.length;

  // 無限スクロール: 下端に近づいたら追加ロード
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      // 下端から500px以内で追加ロード
      if (scrollHeight - scrollTop - clientHeight < 500) {
        setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, sites.length));
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMore, sites.length]);

  // Ctrl+スクロール / ピンチで列数変更
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        onColumnsChange(Math.max(2, Math.min(8, columns + delta)));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [columns, onColumnsChange]);

  // カード以外（空エリア）のクリックで選択解除
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-site-id]")) return;
    if (target.closest("button") || target.closest("a")) return;
    onClearSelection();
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-5"
      onClick={handleContainerClick}
    >
      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-text-secondary">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-[15px] font-medium">該当するサイトがありません</p>
          <p className="text-[13px] mt-1">フィルター条件を変更してみてください</p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {visibleSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              selected={selectedIds.has(site.id)}
              onSelect={onSelect}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}

      {/* もっと読み込み表示 */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <span className="text-[13px] text-text-secondary">
            {visibleSites.length} / {sites.length}件を表示中…スクロールで続きを読み込み
          </span>
        </div>
      )}

      {/* 選択中アクションバー */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900/95 text-white shadow-2xl backdrop-blur-sm">
          <span className="text-sm font-medium">
            {selectedIds.size}件を選択中
          </span>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={() => {
              const selected = sites.filter((s) => selectedIds.has(s.id));
              if (selected.length > 10) {
                const ok = window.confirm(`${selected.length}件のタブを開きます。よろしいですか？`);
                if (!ok) return;
              }
              selected.forEach((s) => {
                window.open(s.url, "_blank", "noopener,noreferrer");
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            まとめて開く
          </button>
          {(() => {
            const ids = sites.filter((s) => selectedIds.has(s.id)).map((s) => s.id);
            const allStarred = ids.length > 0 && ids.every((id) => sites.find((s) => s.id === id)?.starred);
            return (
              <button
                onClick={() => {
                  onSetStarredMany(ids, !allStarred);
                  // アクション完了 → 選択解除してアクションバーを閉じる
                  onClearSelection();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  allStarred ? "bg-white/20 hover:bg-white/30" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {allStarred ? "チェックを外す" : "まとめてチェック"}
              </button>
            );
          })()}
          <button
            onClick={onClearSelection}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            選択解除
          </button>
        </div>
      )}
    </div>
  );
}
