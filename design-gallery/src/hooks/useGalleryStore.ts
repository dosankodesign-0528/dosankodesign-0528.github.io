"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import {
  SiteEntry,
  SourceSite,
  FilterState,
  SiteSignal,
} from "@/types";
import { allSites, dateRange } from "@/data/load-sites";
import { normalizeUrl } from "@/lib/eagle";

// id → 正規化URL の静的対応表（データは実行中に変わらないのでモジュールスコープで一度だけ）。
// ✓の保存キー（正規化URL）への変換と、Eagle重複判定の両方で使う。
const urlById = new Map<string, string>();
for (const s of allSites) urlById.set(s.id, normalizeUrl(s.url));

// 「確認済み」操作などでカードがフィルター外に消える時のレイアウトシフトを
// View Transitions API でなめらかに見せるためのラッパー。
// - 未対応ブラウザ(ユーザー設定 prefers-reduced-motion 含む) では普通に即時更新。
// - flushSync で startViewTransition のコールバック内に React の DOM 反映を閉じ込め、
//   ブラウザに「前後の状態」を取らせる。
function withViewTransition(fn: () => void) {
  if (typeof document === "undefined") {
    fn();
    return;
  }
  const startViewTransition = (
    document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    }
  ).startViewTransition;
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (!startViewTransition || reduceMotion) {
    fn();
    return;
  }
  startViewTransition.call(document, () => {
    flushSync(fn);
  });
}

// 2026-06: 以前は「新着順で先頭1000件だけを母集団にする」上限(VISIBLE_POOL_CAP)を
// 設けていたが、これが原因で
//   ・件数表示が実数(1304等)と食い違って分かりにくい
//   ・非表示にしても cap 外の古いサイトが繰り上がって件数が減らない
// という問題が出た。ユーザー要望で上限を撤廃し、
// 「生きてて・非表示じゃないサイトは全部が母集団」というシンプルな設計にした。
// 描画は Gallery 側のスクロール遅延読み込みで間引かれるので件数が増えても重くならない。

const STARRED_IDS_KEY = "design-gallery:starred-ids";
// 2026-07-18 移行: ✓の真実の源を「正規化URL集合」に変更した新キー。
// 旧キー(STARRED_IDS_KEY)は id=md5(source:url) だったため、同じサイトが
// ソースを変えて再登場（例: sankou→pickup で復活）すると別IDになり✓が
// 外れていた。URLキーならソースが変わっても✓が引き継がれる。
// 旧キーはバックアップとして消さずに残す。
const STARRED_URLS_KEY = "design-gallery:starred-urls";
const FILTER_KEY = "design-gallery:filter";
const COLUMNS_KEY = "design-gallery:columns";
const HIDE_EAGLE_KEY = "design-gallery:hide-eagle-dupes";
// 「もう見ない」で非表示にしたサイトのID集合。データは消さず、見た目上だけ消す。
// 全モード(すべて/未確認/確認済み)から除外され、totalCount からも引かれる。
// 復元はヘッダー歯車アイコンのモーダルから可能。
const HIDDEN_IDS_KEY = "design-gallery:hidden-ids";
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
          // 2026-06-07: 新規ソース (S5-Style) を追加した時、 既存ユーザーの saved.dateRange[1]
          // が古い max (2026-05) のままだと 新規 2026-06 のエントリが全部弾かれて
          // 「フィルタしたら 0 件」になる事故が発生。
          // saved の dateRange の上端 (max) が データの max より古ければ 自動で延長する。
          // 下端 (min) は ユーザー指定を尊重して触らない。
          const savedRange: [string, string] | undefined = Array.isArray(saved.dateRange)
            && saved.dateRange.length === 2 ? saved.dateRange : undefined;
          const adjustedRange: [string, string] = savedRange
            ? [savedRange[0], savedRange[1] < initialFilter.dateRange[1] ? initialFilter.dateRange[1] : savedRange[1]]
            : initialFilter.dateRange;
          setFilter({ ...initialFilter, ...saved, dateRange: adjustedRange });
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
  // - 真実の源は localStorage の「正規化URL集合」（2026-07-18 に ID集合から移行）。
  //   scraped-sites.json 側の starred は常に false なので、ユーザー操作の結果だけを保持する。
  // - 変数名は歴史的経緯で starredIds のままだが、中身は正規化URL。
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [starredLoaded, setStarredLoaded] = useState(false);

  // マウント時に localStorage から読み込む（旧ID形式が残っていればURL形式へ移行）
  useEffect(() => {
    try {
      // 新形式（正規化URL集合）があればそれが真実の源
      const rawUrls = window.localStorage.getItem(STARRED_URLS_KEY);
      if (rawUrls) {
        const arr = JSON.parse(rawUrls);
        if (Array.isArray(arr))
          setStarredIds(new Set(arr.filter((x) => typeof x === "string")));
        setStarredLoaded(true);
        return;
      }

      // 一度だけのマイグレーション: スクレイプ範囲を絞り直したので既存starredを破棄
      const migrated = window.localStorage.getItem(STARRED_MIGRATION_KEY);
      if (migrated !== "done") {
        window.localStorage.removeItem(STARRED_IDS_KEY);
        window.localStorage.setItem(STARRED_MIGRATION_KEY, "done");
        setStarredLoaded(true);
        return;
      }

      // --- 旧ID形式 → URL形式への移行 ---
      const raw = window.localStorage.getItem(STARRED_IDS_KEY);
      const ids: string[] = raw
        ? (JSON.parse(raw) as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
      const urls = new Set<string>();
      const orphans: string[] = [];
      for (const id of ids) {
        const u = urlById.get(id);
        if (u) urls.add(u);
        else orphans.push(id);
      }
      setStarredIds(urls);
      setStarredLoaded(true); // これで永続化effectが新キーへ保存する

      // 現データに存在しないID（過去のスクレイプ整理で消えた項目・ソース変更で別ID化した項目）は、
      // ビルド時に Git 履歴から生成した対応表で可能な限りURLへ解決して救済する。
      if (orphans.length > 0) {
        fetch("/starred-id-url-map.json")
          .then((r) => (r.ok ? r.json() : null))
          .then((map: Record<string, string> | null) => {
            if (!map) return;
            const extra = orphans
              .map((id) => map[id])
              .filter((u): u is string => typeof u === "string");
            if (extra.length === 0) return;
            setStarredIds((prev) => new Set([...prev, ...extra]));
          })
          .catch(() => {
            // 対応表が無い/取れない場合は現データ分だけで移行完了とする
          });
      }
      return;
    } catch {
      // parse失敗時は空のままで継続
    }
    setStarredLoaded(true);
  }, []);

  // 「確認済みを全部クリア」ボタン用
  const clearAllStarred = useCallback(() => {
    setStarredIds(new Set());
  }, []);

  // 非表示(hidden)状態の永続化
  // - 真実の源は localStorage の ID 集合。データ自体は触らず、フィルター時に除外する。
  // - 復元するときは hiddenIds から消すだけ。
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [hiddenLoaded, setHiddenLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHiddenIds(new Set(arr.filter((x) => typeof x === "string")));
      }
    } catch {
      // 壊れていたら空のままで継続
    }
    setHiddenLoaded(true);
  }, []);

  useEffect(() => {
    if (!hiddenLoaded) return;
    try {
      window.localStorage.setItem(HIDDEN_IDS_KEY, JSON.stringify([...hiddenIds]));
    } catch {}
  }, [hiddenIds, hiddenLoaded]);

  // 一括非表示
  const hideMany = useCallback((ids: string[]) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // 個別復元
  const unhideOne = useCallback((id: string) => {
    setHiddenIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // 全復元
  const unhideAll = useCallback(() => {
    setHiddenIds(new Set());
  }, []);

  // starredIds が変化したら localStorage（新キー・URL集合）に書き出す
  // (初回ロード前のsaveは避けたいので starredLoaded を条件に)
  useEffect(() => {
    if (!starredLoaded) return;
    try {
      window.localStorage.setItem(
        STARRED_URLS_KEY,
        JSON.stringify([...starredIds])
      );
    } catch {}
  }, [starredIds, starredLoaded]);

  // allSites に ✓（正規化URL集合）を重ねた実体
  const sites = useMemo<SiteEntry[]>(() => {
    if (starredIds.size === 0) return allSites;
    return allSites.map((s) =>
      starredIds.has(urlById.get(s.id) ?? "") ? { ...s, starred: true } : s
    );
  }, [starredIds]);

  // Eagle重複は常に非表示。以前はトグルだったが、ユーザー要望で「そもそも隠す」方針に変更。
  // 透明性のため、非表示になっている件数は EagleExcludedBar / EagleExcludedModal で見られる。

  // サイトごとの正規化URL（モジュールスコープの静的対応表をそのまま使う）
  const normalizedUrlBySite = urlById;

  // 表示母集団（プール）。
  // 生きてて非表示じゃないサイトを全部、新着順（日付の降順）で並べただけ。
  // フィルター・タブ操作・件数表示は全部このプール内で動く。
  // Eagle 重複もこのプールには含めて、Gallery 表示時に除外する方式
  //（こうしないと Eagle 増減で古いサイトが浮上してきて挙動が読みにくい）。
  const pool = useMemo<SiteEntry[]>(() => {
    const alive = sites.filter((s) => !s.isDead && !hiddenIds.has(s.id));
    return [...alive].sort((a, b) => b.date.localeCompare(a.date));
  }, [sites, hiddenIds]);

  // Eagle以外のフィルタを通したベース（ソート・ラウンドロビンまで済）
  // 母集団は pool（最大 VISIBLE_POOL_CAP 件）。dead/hidden は pool で既に弾いてある。
  const baseFiltered = useMemo(() => {
    const filtered = pool.filter((site) => {
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
  }, [pool, filter]);

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

  // 「全体の件数」= ギャラリーに存在するサイトの実数。
  // ⚠️ ここは VISIBLE_POOL_CAP で切らない。pool（先頭1000件）基準にすると、
  //   非表示にした分が裏の控え（cap外の古いサイト）で即埋め戻されて件数が永久に
  //   1000のまま動かない＝「非表示にしても全体が減らない」バグになる。
  //   なので dead と hidden を除いた全サイト（必要なら Eagle 重複も除く）を数える。
  //   こうすると 1件隠せば必ず 1件減る。
  const totalCount = useMemo<number>(() => {
    const alive = sites.filter((s) => !s.isDead && !hiddenIds.has(s.id));
    if (!hideEagleDuplicates || !eagleUrls || eagleUrls.size === 0) {
      return alive.length;
    }
    return alive.filter((s) => {
      const n = normalizedUrlBySite.get(s.id);
      return n ? !eagleUrls.has(n) : true;
    }).length;
  }, [sites, hiddenIds, eagleUrls, normalizedUrlBySite, hideEagleDuplicates]);

  // 非表示にしたサイトの実体（モーダル表示用）。新しい順。
  const hiddenSites = useMemo<SiteEntry[]>(() => {
    if (hiddenIds.size === 0) return [];
    return sites
      .filter((s) => hiddenIds.has(s.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sites, hiddenIds]);

  // シグナル（Framer / スタジオ / プロダクション）ごとの件数。
  // FilterModal に渡して「何件ヒットしているか」の目安表示に使う。
  // 表示中プール（最大 VISIBLE_POOL_CAP 件）の中で、必要なら Eagle 重複を除いて数える。
  const signalCounts = useMemo<Partial<Record<SiteSignal, number>>>(() => {
    const counts: Partial<Record<SiteSignal, number>> = {};
    const visible = pool.filter((s) => {
      if (hideEagleDuplicates && eagleUrls && eagleUrls.size > 0) {
        const n = normalizedUrlBySite.get(s.id);
        if (n && eagleUrls.has(n)) return false;
      }
      return true;
    });
    for (const s of visible) {
      const sigs = s.signals ?? [];
      for (const sig of sigs) {
        counts[sig] = (counts[sig] ?? 0) + 1;
      }
    }
    return counts;
  }, [pool, eagleUrls, normalizedUrlBySite, hideEagleDuplicates]);

  // スター切り替え（starredIdsを更新 → sitesはuseMemoで自動反映 → localStorageへ永続化）
  // 「未確認」モードのときはカードがその場で消えるので、View Transitions API で
  // 消えるカードはフェード、残るカードは新しい位置へ滑らかに動かす。
  const toggleStar = useCallback((id: string) => {
    const key = urlById.get(id);
    if (!key) return;
    withViewTransition(() => {
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    });
  }, []);

  // 複数まとめて starred を一括セット
  const setStarredMany = useCallback((ids: string[], starred: boolean) => {
    const keys = ids
      .map((id) => urlById.get(id))
      .filter((u): u is string => typeof u === "string");
    withViewTransition(() => {
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (starred) {
          keys.forEach((k) => next.add(k));
        } else {
          keys.forEach((k) => next.delete(k));
        }
        return next;
      });
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
    // 「もう見ない」非表示化
    hiddenSites,
    hiddenCount: hiddenIds.size,
    hideMany,
    unhideOne,
    unhideAll,
  };
}
