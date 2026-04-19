"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SiteEntry,
  SourceSite,
  FilterState,
} from "@/types";
import { allSites, dateRange } from "@/data/load-sites";
import { normalizeUrl } from "@/lib/eagle";

const HIDE_EAGLE_KEY = "design-gallery:hideEagleDuplicates";
const STARRED_IDS_KEY = "design-gallery:starred-ids";
const FILTER_KEY = "design-gallery:filter";
const COLUMNS_KEY = "design-gallery:columns";

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

interface UseGalleryStoreOptions {
  /** Eagleに既に入っているサイトの正規化済みURL集合（hideEagleDuplicates有効時に利用） */
  eagleUrls?: Set<string>;
}

export function useGalleryStore(options: UseGalleryStoreOptions = {}) {
  const { eagleUrls } = options;
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [columns, setColumns] = useState(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // filter・columns も localStorage で永続化。
  // リロードボタンを押しても検索/ソース選択/ソート順/列数などは保たれる。
  const [persistLoaded, setPersistLoaded] = useState(false);
  useEffect(() => {
    try {
      const rawFilter = window.localStorage.getItem(FILTER_KEY);
      if (rawFilter) {
        const saved = JSON.parse(rawFilter);
        if (saved && typeof saved === "object") {
          // initialFilter とマージ（形が変わったとき欠けたフィールドは初期値が入る）
          setFilter({ ...initialFilter, ...saved });
        }
      }
    } catch {
      // 壊れていたら無視
    }
    try {
      const rawCols = window.localStorage.getItem(COLUMNS_KEY);
      if (rawCols) {
        const n = Number(rawCols);
        if (Number.isFinite(n) && n >= 2 && n <= 8) setColumns(n);
      }
    } catch {}
    setPersistLoaded(true);
  }, []);

  useEffect(() => {
    if (!persistLoaded) return;
    try {
      window.localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
    } catch {}
  }, [filter, persistLoaded]);

  useEffect(() => {
    if (!persistLoaded) return;
    try {
      window.localStorage.setItem(COLUMNS_KEY, String(columns));
    } catch {}
  }, [columns, persistLoaded]);

  // 確認済み(star)状態の永続化
  // - 真実の源は localStorage の ID 集合。scraped-sites.json 側の starred は常に false なので、
  //   ここでユーザー操作の結果だけを保持すれば良い。
  // - ブラウザを閉じても再訪時に復元される。
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [starredLoaded, setStarredLoaded] = useState(false);

  // マウント時に localStorage から starred ID を読み込む
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STARRED_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setStarredIds(new Set(arr.filter((x) => typeof x === "string")));
      }
    } catch {
      // parse失敗時は空のままで継続
    }
    setStarredLoaded(true);
  }, []);

  // starredIds が変化したら localStorage に書き出す
  // (初回ロード前のsaveは避けたいので starredLoaded を条件に)
  useEffect(() => {
    if (!starredLoaded) return;
    try {
      window.localStorage.setItem(
        STARRED_IDS_KEY,
        JSON.stringify([...starredIds])
      );
    } catch {}
  }, [starredIds, starredLoaded]);

  // allSites に starredIds を重ねた実体
  const sites = useMemo<SiteEntry[]>(() => {
    if (starredIds.size === 0) return allSites;
    return allSites.map((s) =>
      starredIds.has(s.id) ? { ...s, starred: true } : s
    );
  }, [starredIds]);

  // Eagle重複非表示トグル（localStorage永続化、デフォルトON）
  // 「既に見たもの（Eagle収録済み）は常に隠す」のが基本姿勢。ユーザーが明示的に
  // "false" に切り替えた時だけ表示に戻す。
  const [hideEagleDuplicates, setHideEagleDuplicates] = useState(true);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HIDE_EAGLE_KEY);
      if (saved === "false") setHideEagleDuplicates(false);
      else if (saved === "true") setHideEagleDuplicates(true);
      // saved が null（初回）の場合はデフォルト true のまま
    } catch {}
  }, []);
  const toggleHideEagleDuplicates = useCallback(() => {
    setHideEagleDuplicates((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(HIDE_EAGLE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  // サイトごとの正規化URLを一度だけ計算
  const normalizedUrlBySite = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sites) m.set(s.id, normalizeUrl(s.url));
    return m;
  }, [sites]);

  // Eagle以外のフィルタを通したベース（ソート・ラウンドロビンまで済）
  const baseFiltered = useMemo(() => {
    const filtered = sites.filter((site) => {
      // リンク切れは常に非表示（断捨離）
      if (site.isDead) return false;
      if (filter.viewMode === "unchecked" && site.starred) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const match =
          site.title.toLowerCase().includes(q) ||
          site.url.toLowerCase().includes(q) ||
          (site.agency?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      if (filter.sources.length > 0 && !filter.sources.includes(site.source)) {
        return false;
      }
      if (
        filter.categories.length > 0 &&
        !site.category.some((c) => filter.categories.includes(c))
      ) {
        return false;
      }
      if (
        filter.tastes.length > 0 &&
        !site.taste.some((t) => filter.tastes.includes(t))
      ) {
        return false;
      }
      if (filter.agencyOnly && !site.isAgency) return false;
      if (site.date < filter.dateRange[0] || site.date > filter.dateRange[1]) {
        return false;
      }
      if (filter.starredOnly && !site.starred) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (filter.sortOrder === "newest") return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });

    // ソース（メディア）ごとにラウンドロビン
    const bySource = new Map<SourceSite, SiteEntry[]>();
    for (const site of filtered) {
      const arr = bySource.get(site.source);
      if (arr) arr.push(site);
      else bySource.set(site.source, [site]);
    }
    const queues = Array.from(bySource.values());
    const interleaved: SiteEntry[] = [];
    let idx = 0;
    while (interleaved.length < filtered.length) {
      const q = queues[idx % queues.length];
      const next = q.shift();
      if (next) interleaved.push(next);
      idx++;
    }
    return interleaved;
  }, [sites, filter]);

  // Eagleに含まれていて「本来なら表示されるはず」だったサイト
  const eagleExcludedSites = useMemo<SiteEntry[]>(() => {
    if (!eagleUrls || eagleUrls.size === 0) return [];
    return baseFiltered.filter((s) => {
      const n = normalizedUrlBySite.get(s.id);
      return n ? eagleUrls.has(n) : false;
    });
  }, [baseFiltered, eagleUrls, normalizedUrlBySite]);

  // 実際にギャラリーへ出すサイト
  const filteredSites = useMemo<SiteEntry[]>(() => {
    if (!hideEagleDuplicates || !eagleUrls || eagleUrls.size === 0) {
      return baseFiltered;
    }
    return baseFiltered.filter((s) => {
      const n = normalizedUrlBySite.get(s.id);
      return n ? !eagleUrls.has(n) : true;
    });
  }, [baseFiltered, hideEagleDuplicates, eagleUrls, normalizedUrlBySite]);

  // スター切り替え（starredIdsを更新 → sitesはuseMemoで自動反映 → localStorageへ永続化）
  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 複数まとめて starred を一括セット
  const setStarredMany = useCallback((ids: string[], starred: boolean) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (starred) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  // 選択操作
  const handleSelect = useCallback(
    (id: string, e: { shiftKey: boolean; metaKey: boolean }) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (e.shiftKey) {
          // Shift+クリック: 範囲選択
          const ids = filteredSites.map((s) => s.id);
          // アンカー決定: lastSelectedId → 既に選択済みのうち最初のもの → なし
          let anchor: string | null = lastSelectedId;
          if (!anchor || !ids.includes(anchor)) {
            anchor = ids.find((i) => prev.has(i)) ?? null;
          }
          if (anchor) {
            const startIdx = ids.indexOf(anchor);
            const endIdx = ids.indexOf(id);
            if (startIdx >= 0 && endIdx >= 0) {
              const [from, to] = [
                Math.min(startIdx, endIdx),
                Math.max(startIdx, endIdx),
              ];
              for (let i = from; i <= to; i++) {
                next.add(ids[i]);
              }
            } else {
              next.clear();
              next.add(id);
            }
          } else {
            // アンカー無し（初回 Shift+クリック）→ 単一選択
            next.clear();
            next.add(id);
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
  // lastId を指定すると、次の Shift+クリックの範囲アンカーとして使われる
  const setSelection = useCallback((ids: string[], lastId?: string) => {
    setSelectedIds(new Set(ids));
    if (lastId !== undefined) {
      setLastSelectedId(lastId || null);
    }
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
    columns,
    setColumns,
    selectedIds,
    handleSelect,
    clearSelection,
    addToSelection,
    setSelection,
    toggleStar,
    setStarredMany,
    hideEagleDuplicates,
    toggleHideEagleDuplicates,
    eagleExcludedSites,
  };
}
