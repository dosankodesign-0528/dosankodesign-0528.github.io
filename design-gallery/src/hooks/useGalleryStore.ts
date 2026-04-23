"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SiteEntry,
  SourceSite,
  FilterState,
  SiteSignal,
} from "@/types";
import { allSites, dateRange } from "@/data/load-sites";
import { normalizeUrl } from "@/lib/eagle";

const STARRED_IDS_KEY = "design-gallery:starred-ids";
const FILTER_KEY = "design-gallery:filter";
const COLUMNS_KEY = "design-gallery:columns";
const HIDE_EAGLE_KEY = "design-gallery:hide-eagle-dupes";
// 2026-04: 大規模スクレイプ後にユーザー依頼で全starredを一度だけリセット。
// 値がtrueになっているブラウザは以後リセットしない（再度消したくなったらキー名を変える）
const STARRED_MIGRATION_KEY = "design-gallery:starred-cleared:2026-04";

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
  signals: [],
};

interface UseGalleryStoreOptions {
  /** Eagleに既に入っているサイトの正規化済みURL集合（常に非表示扱い） */
  eagleUrls?: Set<string>;
}

export function useGalleryStore(options: UseGalleryStoreOptions = {}) {
  const { eagleUrls } = options;
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [columns, setColumns] = useState(4);
  // Eagle 重複を隠すかどうか（ユーザー要望で再導入）。
  // デフォルト true = 従来通り非表示。false にすると全部出てくる。
  const [hideEagleDuplicates, setHideEagleDuplicates] = useState(true);
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
        if (Number.isFinite(n) && n >= 2 && n <= 10) setColumns(n);
      }
    } catch {}
    try {
      const rawHide = window.localStorage.getItem(HIDE_EAGLE_KEY);
      // 未設定 or "true" ならデフォルトの true を維持、"false" の時だけ false
      if (rawHide === "false") setHideEagleDuplicates(false);
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

  useEffect(() => {
    if (!persistLoaded) return;
    try {
      window.localStorage.setItem(HIDE_EAGLE_KEY, String(hideEagleDuplicates));
    } catch {}
  }, [hideEagleDuplicates, persistLoaded]);

  // 確認済み(star)状態の永続化
  // - 真実の源は localStorage の ID 集合。scraped-sites.json 側の starred は常に false なので、
  //   ここでユーザー操作の結果だけを保持すれば良い。
  // - ブラウザを閉じても再訪時に復元される。
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [starredLoaded, setStarredLoaded] = useState(false);

  // マウント時に localStorage から starred ID を読み込む
  useEffect(() => {
    try {
      // 一度だけのマイグレーション: スクレイプ範囲を絞り直したので既存starredを破棄
      const migrated = window.localStorage.getItem(STARRED_MIGRATION_KEY);
      if (migrated !== "done") {
        window.localStorage.removeItem(STARRED_IDS_KEY);
        window.localStorage.setItem(STARRED_MIGRATION_KEY, "done");
        setStarredLoaded(true);
        return;
      }

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

  // 「確認済みを全部クリア」ボタン用
  const clearAllStarred = useCallback(() => {
    setStarredIds(new Set());
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

  // Eagle重複は常に非表示。以前はトグルだったが、ユーザー要望で「そもそも隠す」方針に変更。
  // 透明性のため、非表示になっている件数は EagleExcludedBar / EagleExcludedModal で見られる。

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
      // signals: 選択された全シグナルを持つサイトだけを通す（AND条件）
      if (filter.signals.length > 0) {
        const mySignals = site.signals ?? [];
        const hasAll = filter.signals.every((sig) => mySignals.includes(sig));
        if (!hasAll) return false;
      }
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

  // 実際にギャラリーへ出すサイト。
  // hideEagleDuplicates=true のとき Eagle 重複を除外、false なら全部出す。
  const filteredSites = useMemo<SiteEntry[]>(() => {
    if (!hideEagleDuplicates) return baseFiltered;
    if (!eagleUrls || eagleUrls.size === 0) return baseFiltered;
    return baseFiltered.filter((s) => {
      const n = normalizedUrlBySite.get(s.id);
      return n ? !eagleUrls.has(n) : true;
    });
  }, [baseFiltered, eagleUrls, normalizedUrlBySite, hideEagleDuplicates]);

  // 分母に使う「生きてる」全サイト数。
  // hideEagleDuplicates=true の時は Eagle 重複を母数から外し、false の時は含める。
  const totalCount = useMemo<number>(() => {
    const alive = sites.filter((s) => !s.isDead);
    if (!hideEagleDuplicates) return alive.length;
    if (!eagleUrls || eagleUrls.size === 0) return alive.length;
    return alive.filter((s) => {
      const n = normalizedUrlBySite.get(s.id);
      return n ? !eagleUrls.has(n) : true;
    }).length;
  }, [sites, eagleUrls, normalizedUrlBySite, hideEagleDuplicates]);

  // シグナル（Framer / スタジオ / プロダクション）ごとの件数。
  // FilterModal に渡して「何件ヒットしているか」の目安表示に使う。
  // 生きてて Eagle にも入ってない母集団で数える。
  const signalCounts = useMemo<Partial<Record<SiteSignal, number>>>(() => {
    const counts: Partial<Record<SiteSignal, number>> = {};
    const aliveNonEagle = sites.filter((s) => {
      if (s.isDead) return false;
      if (hideEagleDuplicates && eagleUrls && eagleUrls.size > 0) {
        const n = normalizedUrlBySite.get(s.id);
        if (n && eagleUrls.has(n)) return false;
      }
      return true;
    });
    for (const s of aliveNonEagle) {
      const sigs = s.signals ?? [];
      for (const sig of sigs) {
        counts[sig] = (counts[sig] ?? 0) + 1;
      }
    }
    return counts;
  }, [sites, eagleUrls, normalizedUrlBySite, hideEagleDuplicates]);

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
    clearAllStarred,
    starredCount: starredIds.size,
    eagleExcludedSites,
    totalCount,
    signalCounts,
    hideEagleDuplicates,
    toggleHideEagleDuplicates: () =>
      setHideEagleDuplicates((v) => !v),
    setHideEagleDuplicates,
  };
}
