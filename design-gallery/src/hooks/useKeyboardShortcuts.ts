"use client";

import { useEffect } from "react";
import { SiteEntry } from "@/types";

interface UseKeyboardShortcutsProps {
  selectedIds: Set<string>;
  sites: SiteEntry[];
  onToggleStar: (id: string) => void;
  onClearSelection: () => void;
}

export function useKeyboardShortcuts({
  selectedIds,
  sites,
  onToggleStar,
  onClearSelection,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+Shift+O: 選択中のサイトを開く
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        const selected = sites.filter((s) => selectedIds.has(s.id));
        selected.forEach((s) => {
          window.open(s.url, "_blank", "noopener,noreferrer");
        });
        return;
      }

      // Escape: 選択解除
      if (e.key === "Escape") {
        onClearSelection();
        return;
      }

      // B or F: お気に入りトグル（選択中のアイテム）
      if (e.key.toLowerCase() === "b" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

        selectedIds.forEach((id) => {
          onToggleStar(id);
        });
        return;
      }

      // ⌘+A: 全選択（ここでは制御しないがブラウザデフォルトを防ぐため）
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, sites, onToggleStar, onClearSelection]);
}
