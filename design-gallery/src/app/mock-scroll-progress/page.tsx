"use client";

/**
 * 無限スクロール時の「今どのへん見てるか」インジケーター 3案 比較プレビュー
 *
 * 案A: ミニ件数チップ（右上フロート）
 *   - 最小限の干渉。スクロール中だけ薄く濃くなる。
 *   - 「540 / 2,732」と現在件数だけ。
 *
 * 案B: 縦プログレスバー（右端）
 *   - スクロール位置を縦バーで視覚化。
 *   - ドラッグで瞬間ジャンプ可。ホバーで件数プレビュー。
 *
 * 案C: 月別タイムライン（右端、月ジャンプ機能付き）
 *   - 月ごとのマーカーが並ぶ。今いる月をハイライト。
 *   - クリックでその月の最初に瞬間移動。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { allSites } from "@/data/load-sites";
import { SiteEntry } from "@/types";

// 比較用のデモなので、実データ先頭500件くらいで十分
const DEMO_SITES = allSites.filter((s) => !s.isDead).slice(0, 800);

type Variant = "A" | "B" | "C";

const VARIANTS: { id: Variant; title: string; subtitle: string }[] = [
  {
    id: "A",
    title: "案A: ミニ件数チップ",
    subtitle: "右上に小さく「N / M」だけ。最小限の介入。",
  },
  {
    id: "B",
    title: "案B: 縦プログレスバー",
    subtitle: "右端の縦バーで視覚化。ドラッグでジャンプも可。",
  },
  {
    id: "C",
    title: "案C: 月別タイムライン",
    subtitle: "月ごとにマーカー。クリックで月にジャンプ。",
  },
];

export default function MockScrollProgressPage() {
  const [variant, setVariant] = useState<Variant>("A");

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* ヘッダー（案切替） */}
      <header className="shrink-0 border-b border-border bg-white">
        <div className="px-5 py-3 flex items-center gap-4">
          <h1 className="text-[14px] font-bold text-text-primary">
            スクロール位置インジケーター 3案 比較
          </h1>
          <div className="ml-auto inline-flex p-0.5 bg-bg-secondary rounded-lg">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`px-3 h-7 rounded-md text-[12px] font-medium transition-all ${
                  variant === v.id
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {v.title.replace(/^案[A-Z]:\s*/, "")}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-3 text-[12px] text-text-secondary">
          {VARIANTS.find((v) => v.id === variant)?.subtitle} · デモ:{" "}
          {DEMO_SITES.length.toLocaleString()} 件
        </div>
      </header>

      {/* ギャラリー本体 + インジケーター */}
      <main className="flex-1 overflow-hidden">
        {variant === "A" && <VariantA sites={DEMO_SITES} />}
        {variant === "B" && <VariantB sites={DEMO_SITES} />}
        {variant === "C" && <VariantC sites={DEMO_SITES} />}
      </main>
    </div>
  );
}

// =============================================================================
// 共通: スクロール位置から「現在見ている件数（先頭から何件目）」を計算するフック
// =============================================================================
function useCurrentIndex(
  containerRef: React.RefObject<HTMLDivElement | null>,
  itemCount: number,
  columns: number
) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calc = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = Math.max(1, scrollHeight - clientHeight);
      const pct = scrollTop / max;
      // ビューポートの中央が今どの行にいるかを推定
      const rowsTotal = Math.ceil(itemCount / columns);
      const visibleRows = clientHeight / 200; // カード高さ ~200px と仮定
      const currentRow = Math.min(
        rowsTotal - 1,
        Math.floor((scrollTop / max) * (rowsTotal - visibleRows / 2))
      );
      const idx = Math.min(itemCount, Math.max(0, currentRow * columns));
      setCurrentIdx(idx);
      setScrollPct(pct);
    };

    calc();
    el.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      el.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, [containerRef, itemCount, columns]);

  return { currentIdx, scrollPct };
}

// =============================================================================
// 共通: ギャラリーグリッド（軽量版、サムネ + タイトルのみ）
// =============================================================================
function DemoGrid({
  sites,
  columns = 4,
}: {
  sites: SiteEntry[];
  columns?: number;
}) {
  return (
    <div
      className="grid gap-4 p-5"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {sites.map((site, i) => (
        <div
          key={site.id}
          data-card-idx={i}
          className="rounded-xl bg-bg-secondary overflow-hidden"
        >
          <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
            <img
              src={site.thumbnailUrl}
              alt={site.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-3 py-2">
            <p className="text-[12px] font-semibold text-text-primary truncate">
              {site.title}
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5 tabular-nums">
              {site.date} · {i + 1} 番目
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// 案A: ミニ件数チップ（右上フロート、スクロール中だけ目立つ）
// =============================================================================
function VariantA({ sites }: { sites: SiteEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const COLS = 4;
  const { currentIdx } = useCurrentIndex(containerRef, sites.length, COLS);
  const [scrolling, setScrolling] = useState(false);
  const scrollEndTimer = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrolling(true);
      if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = window.setTimeout(() => setScrolling(false), 800);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto relative">
      <DemoGrid sites={sites} columns={COLS} />
      {/* ミニ件数チップ（右上、sticky 風だが overflow 上に absolute で置く） */}
      <div
        className={`fixed top-[88px] right-6 z-40 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur shadow-md border border-border text-[12px] font-medium tabular-nums transition-all duration-300 ${
          scrolling
            ? "opacity-100 scale-100"
            : "opacity-60 scale-95"
        }`}
      >
        <span className="text-text-primary font-bold">
          {(currentIdx + 1).toLocaleString()}
        </span>
        <span className="text-text-secondary"> / {sites.length.toLocaleString()}</span>
      </div>
    </div>
  );
}

// =============================================================================
// 案B: 縦プログレスバー（右端）
//  - 細い縦のレール + 現在位置インジケーター
//  - ドラッグでスクロール瞬間ジャンプ
//  - ホバーで件数プレビュー
// =============================================================================
function VariantB({ sites }: { sites: SiteEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const COLS = 4;
  const { currentIdx, scrollPct } = useCurrentIndex(
    containerRef,
    sites.length,
    COLS
  );
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleMove = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return pct;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pct = handleMove(e.clientY);
    if (pct !== undefined) setHoverPct(pct);
  };

  const jumpTo = (pct: number) => {
    const el = containerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: pct * max, behavior: dragging ? "auto" : "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const pct = handleMove(e.clientY);
    if (pct !== undefined) jumpTo(pct);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const pct = handleMove(e.clientY);
      if (pct !== undefined) jumpTo(pct);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const hoverIdx =
    hoverPct !== null
      ? Math.min(sites.length, Math.max(1, Math.round(hoverPct * sites.length)))
      : null;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto relative">
      <DemoGrid sites={sites} columns={COLS} />

      {/* 右端プログレスバー */}
      <div
        ref={trackRef}
        className="fixed top-[88px] right-3 bottom-6 w-3 z-40 group"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverPct(null)}
        onMouseDown={onMouseDown}
        style={{ cursor: dragging ? "grabbing" : "pointer" }}
      >
        {/* レール（薄いグレー） */}
        <div className="absolute inset-y-0 left-1 w-1 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors" />
        {/* 進捗（青） */}
        <div
          className="absolute left-1 w-1 rounded-full bg-accent transition-[height] duration-100"
          style={{
            top: 0,
            height: `${scrollPct * 100}%`,
          }}
        />
        {/* 現在位置サム（白円） */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white shadow transition-[top] duration-100"
          style={{ top: `calc(${scrollPct * 100}% - 6px)` }}
        />
        {/* ホバー時のラベル */}
        {hoverPct !== null && hoverIdx !== null && (
          <div
            className="absolute right-5 px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium tabular-nums shadow-lg pointer-events-none whitespace-nowrap"
            style={{ top: `calc(${hoverPct * 100}% - 12px)` }}
          >
            {hoverIdx.toLocaleString()} 件目
            <span className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0"
              style={{
                borderLeft: "4px solid rgb(17 24 39)",
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
              }}
            />
          </div>
        )}
        {/* 上下端の件数ラベル（常時表示、薄め） */}
        <div className="absolute -left-12 top-0 text-[10px] text-text-secondary tabular-nums">1</div>
        <div className="absolute -left-14 bottom-0 text-[10px] text-text-secondary tabular-nums">
          {sites.length.toLocaleString()}
        </div>
      </div>

      {/* 右上のチップで「現在 N 件目 / M 件中」も補助表示（B案も件数チップ併用が分かりやすい） */}
      <div className="fixed top-[88px] right-12 z-40 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur shadow-md border border-border text-[12px] font-medium tabular-nums">
        <span className="text-text-primary font-bold">
          {(currentIdx + 1).toLocaleString()}
        </span>
        <span className="text-text-secondary"> / {sites.length.toLocaleString()}</span>
      </div>
    </div>
  );
}

// =============================================================================
// 案C: 月別タイムライン（右端、月ジャンプ機能付き）
// =============================================================================
function VariantC({ sites }: { sites: SiteEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const COLS = 4;

  // 月ごとに件数を集計（ソート済み前提）
  const monthGroups = useMemo(() => {
    const map = new Map<string, { count: number; firstIdx: number }>();
    sites.forEach((s, i) => {
      const cur = map.get(s.date);
      if (cur) cur.count++;
      else map.set(s.date, { count: 1, firstIdx: i });
    });
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sites]);

  const [currentDate, setCurrentDate] = useState<string>(monthGroups[0]?.date || "");

  // スクロールに連動して「今どの月にいるか」を更新
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = el.querySelectorAll<HTMLElement>("[data-card-idx]");
      const containerTop = el.getBoundingClientRect().top;
      // 画面の上から1/3 の位置を「今見てる」基準にする
      const viewportLine = containerTop + el.clientHeight * 0.33;
      let idx = 0;
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        if (r.top > viewportLine) break;
        idx = parseInt(c.dataset.cardIdx || "0", 10);
      }
      const date = sites[idx]?.date || "";
      if (date && date !== currentDate) setCurrentDate(date);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [sites, currentDate]);

  const jumpToMonth = (date: string, firstIdx: number) => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-card-idx="${firstIdx}"]`);
    if (!card) return;
    const containerTop = el.getBoundingClientRect().top;
    const cardTop = card.getBoundingClientRect().top;
    el.scrollTo({
      top: el.scrollTop + (cardTop - containerTop) - 12,
      behavior: "smooth",
    });
    setCurrentDate(date);
  };

  // "2024-09" → "24年9月"
  const fmt = (yyyymm: string) => {
    const m = yyyymm.match(/^(\d{4})-(\d{2})$/);
    if (!m) return yyyymm;
    return `${m[1].slice(2)}年${parseInt(m[2], 10)}月`;
  };

  return (
    <div className="h-full flex">
      {/* ギャラリー（左、メインスクロール） */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <DemoGrid sites={sites} columns={COLS} />
      </div>

      {/* 右側のタイムライン（縦に並んだ月マーカー） */}
      <aside className="shrink-0 w-[120px] border-l border-border bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-border">
          <p className="text-[10px] font-bold text-text-secondary tracking-wide">
            タイムライン
          </p>
          <p className="text-[11px] text-text-primary tabular-nums">
            {monthGroups.length} ヶ月 / {sites.length.toLocaleString()} 件
          </p>
        </div>
        <ol className="py-2">
          {monthGroups.map((g) => {
            const active = g.date === currentDate;
            return (
              <li key={g.date}>
                <button
                  onClick={() => jumpToMonth(g.date, g.firstIdx)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors ${
                    active
                      ? "bg-accent/10"
                      : "hover:bg-bg-secondary"
                  }`}
                >
                  <span
                    className={`w-1 h-4 rounded-full transition-colors ${
                      active ? "bg-accent" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] tabular-nums ${
                        active
                          ? "font-bold text-accent"
                          : "text-text-primary"
                      }`}
                    >
                      {fmt(g.date)}
                    </p>
                    <p className="text-[10px] text-text-secondary tabular-nums">
                      {g.count} 件
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
