"use client";

import { useState, useCallback, useMemo } from "react";
import {
  SiteEntry,
  SourceSite,
  FilterState,
  LayoutMode,
} from "@/types";
import { allSites, dateRange } from "@/data/load-sites";

const initialFilter: FilterState = {
  search: "",
  sources: [],
  categories: [],
  tastes: [],
  agencyOnly: false,
  dateRange: dateRange,
  starredOnly: false,
  sortOrder: "newest",
  viewMode: "unchecked",
};

export function useGalleryStore() {
  const [sites, setSites] = useState<SiteEntry[]>(allSites);
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [columns, setColumns] = useState(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // フィルタリング + ソート
  const filteredSites = useMemo(() => {
    const filtered = sites.filter((site) => {
      // ビューモード: "unchecked"ならチェック済み（starred）を非表示
      if (filter.viewMode === "unchecked" && site.starred) {
        return false;
      }
      // テキスト検索
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const match =
          site.title.toLowerCase().includes(q) ||
          site.url.toLowerCase().includes(q) ||
          (site.agency?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      // ソースフィルター
      if (filter.sources.length > 0 && !filter.sources.includes(site.source)) {
        return false;
      }
      // カテゴリ
      if (
        filter.categories.length > 0 &&
        !site.category.some((c) => filter.categories.includes(c))
      ) {
        return false;
      }
      // テイスト
      if (
        filter.tastes.length > 0 &&
        !site.taste.some((t) => filter.tastes.includes(t))
      ) {
        return false;
      }
      // 制作会社フィルター
      if (filter.agencyOnly && !site.isAgency) {
        return false;
      }
      // 日付範囲
      if (site.date < filter.dateRange[0] || site.date > filter.dateRange[1]) {
        return false;
      }
      // スター（starredOnlyは「すべて」モードでチェック済みだけ見たい時用）
      if (filter.starredOnly && !site.starred) {
        return false;
      }
      return true;
    });

    // ソート（日付順）
    filtered.sort((a, b) => {
      if (filter.sortOrder === "newest") {
        return b.date.localeCompare(a.date);
      }
      return a.date.localeCompare(b.date);
    });

    return filtered;
  }, [sites, filter]);

  // スター切り替え
  const toggleStar = useCallback((id: string) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: !s.starred } : s))
    );
  }, []);

  // 選択操作
  const handleSelect = useCallback(
    (id: string, e: { shiftKey: boolean; metaKey: boolean }) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (e.shiftKey && lastSelectedId) {
          // Shift+クリック: 範囲選択
          const ids = filteredSites.map((s) => s.id);
          const startIdx = ids.indexOf(lastSelectedId);
          const endIdx = ids.indexOf(id);
          const [from, to] = [
            Math.min(startIdx, endIdx),
            Math.max(startIdx, endIdx),
          ];
          for (let i = from; i <= to; i++) {
            next.add(ids[i]);
          }
        } else if (e.metaKey) {
          // Cmd+クリック: トグル
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        } else {
          // 通常クリック: 単一選択
          next.clear();
          next.add(id);
        }

        return next;
      });
      setLastSelectedId(id);
    },
    [lastSelectedId, filteredSites]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  // ドラッグ選択で一括追加
  const addToSelection = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // ドラッグ選択で一括セット（置き換え）
  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // フィルター更新ヘルパー
  const updateFilter = useCallback(
    (partial: Partial<FilterState>) => {
      setFilter((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const resetFilter = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  // ソースタブ切り替え
  const toggleSource = useCallback((source: SourceSite) => {
    setFilter((prev) => {
      const sources = prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source];
      return { ...prev, sources };
    });
  }, []);

  return {
    sites,
    filteredSites,
    filter,
    updateFilter,
    resetFilter,
    toggleSource,
    layout,
    setLayout,
    columns,
    setColumns,
    selectedIds,
    handleSelect,
    clearSelection,
    addToSelection,
    setSelection,
    toggleStar,
  };
}
