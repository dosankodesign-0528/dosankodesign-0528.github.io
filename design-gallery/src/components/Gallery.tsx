"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { SiteEntry, LayoutMode } from "@/types";
import { SiteCard } from "./SiteCard";

interface GalleryProps {
  sites: SiteEntry[];
  layout: LayoutMode;
  columns: number;
  selectedIds: Set<string>;
  onSelect: (id: string, e: { shiftKey: boolean; metaKey: boolean }) => void;
  onToggleStar: (id: string) => void;
  onClearSelection: () => void;
  onColumnsChange: (cols: number) => void;
  onSetSelection: (ids: string[]) => void;
}

export function Gallery({
  sites,
  layout,
  columns,
  selectedIds,
  onSelect,
  onToggleStar,
  onClearSelection,
  onColumnsChange,
  onSetSelection,
}: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragBox, setDragBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

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

  // 背景クリックで選択解除
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current || e.target === (containerRef.current?.firstChild as HTMLElement)) {
        onClearSelection();
      }
    },
    [onClearSelection]
  );

  // ドラッグ選択（iOS風）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // カードの上でのクリックはスキップ（カード側のonSelectで処理）
      const target = e.target as HTMLElement;
      if (target.closest("[data-site-id]")) return;
      if (target.closest("button") || target.closest("a")) return;

      // 左ボタンのみ
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      let isDragging = false;

      const handleMouseMove = (moveE: MouseEvent) => {
        const dist = Math.abs(moveE.clientX - startX) + Math.abs(moveE.clientY - startY);
        if (dist < 5 && !isDragging) return; // 微小移動は無視
        isDragging = true;

        setDragBox({
          startX,
          startY,
          currentX: moveE.clientX,
          currentY: moveE.clientY,
        });

        // ドラッグボックスと重なるカードを選択
        const box = {
          left: Math.min(startX, moveE.clientX),
          right: Math.max(startX, moveE.clientX),
          top: Math.min(startY, moveE.clientY),
          bottom: Math.max(startY, moveE.clientY),
        };

        const cards = containerRef.current?.querySelectorAll("[data-site-id]");
        const intersecting: string[] = [];
        cards?.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          if (
            cardRect.left < box.right &&
            cardRect.right > box.left &&
            cardRect.top < box.bottom &&
            cardRect.bottom > box.top
          ) {
            const id = card.getAttribute("data-site-id");
            if (id) intersecting.push(id);
          }
        });
        onSetSelection(intersecting);
      };

      const handleMouseUp = () => {
        if (!isDragging) {
          // ドラッグなし = 背景クリック = 選択解除
          onClearSelection();
        }
        setDragBox(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onClearSelection, onSetSelection]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-5"
      onMouseDown={handleMouseDown}
    >
      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-text-secondary">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-[15px] font-medium">該当するサイトがありません</p>
          <p className="text-[13px] mt-1">フィルター条件を変更してみてください</p>
        </div>
      ) : layout === "grid" ? (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              selected={selectedIds.has(site.id)}
              onSelect={onSelect}
              onToggleStar={onToggleStar}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div
          className="masonry-grid"
          style={{ columnCount: columns }}
        >
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              selected={selectedIds.has(site.id)}
              onSelect={onSelect}
              onToggleStar={onToggleStar}
              layout="waterfall"
            />
          ))}
        </div>
      )}

      {/* ドラッグ選択ボックス */}
      {dragBox && (
        <div
          className="selection-box"
          style={{
            left: Math.min(dragBox.startX, dragBox.currentX),
            top: Math.min(dragBox.startY, dragBox.currentY),
            width: Math.abs(dragBox.currentX - dragBox.startX),
            height: Math.abs(dragBox.currentY - dragBox.startY),
          }}
        />
      )}
    </div>
  );
}
