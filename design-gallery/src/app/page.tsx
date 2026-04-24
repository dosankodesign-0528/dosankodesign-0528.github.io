"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { Gallery } from "@/components/Gallery";
import { UpdateNotificationModal } from "@/components/UpdateNotificationModal";
import { EagleExcludedModal } from "@/components/EagleExcludedModal";
import { EagleExcludedBar } from "@/components/EagleExcludedBar";
import { useGalleryStore } from "@/hooks/useGalleryStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEagleSync } from "@/hooks/useEagleSync";
import { lastScrapedAt } from "@/data/load-sites";
import { SourceSite } from "@/types";

const LAST_SEEN_KEY = "design-gallery:lastSeenAt";

export default function Home() {
  const eagle = useEagleSync();
  const store = useGalleryStore({ eagleUrls: eagle.eagleUrls });
  const [updateCounts, setUpdateCounts] = useState<Partial<
    Record<SourceSite, number>
  > | null>(null);
  const [showEagleExcluded, setShowEagleExcluded] = useState(false);

  useKeyboardShortcuts({
    selectedIds: store.selectedIds,
    sites: store.filteredSites,
    onToggleStar: store.toggleStar,
    onClearSelection: store.clearSelection,
  });

  // メインギャラリー画面ではbody全体をロック（Gallery内部で自前スクロール）。
  // モックページ等はこのクラスが付かないので通常スクロールが効く。
  useEffect(() => {
    document.body.classList.add("lock-body-scroll");
    return () => document.body.classList.remove("lock-body-scroll");
  }, []);

  // 初回マウントで「新規追加サイト」を検出しモーダル表示判定
  useEffect(() => {
    try {
      // デモ用: ?demo=update でダミーカウントを表示
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "update") {
        setUpdateCounts({
          sankou: 12,
          muuuuu: 8,
          webdesignclip: 5,
          "81web": 3,
        });
        return;
      }

      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      const baseline = lastScrapedAt ?? new Date().toISOString();

      // 初回アクセス: モーダル出さず、ベースラインだけ保存
      if (!lastSeen) {
        localStorage.setItem(LAST_SEEN_KEY, baseline);
        return;
      }

      // 前回見た時刻より後に追加されたサイトをソース別にカウント
      const counts: Partial<Record<SourceSite, number>> = {};
      for (const site of store.sites) {
        if (site.firstSeen && site.firstSeen > lastSeen) {
          counts[site.source] = (counts[site.source] ?? 0) + 1;
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
      if (total > 0) {
        setUpdateCounts(counts);
      }
    } catch (e) {
      // localStorage 使えない環境（プライベートブラウジング等）は黙ってスキップ
      console.warn("update notification skipped:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseModal = () => {
    try {
      if (lastScrapedAt) {
        localStorage.setItem(LAST_SEEN_KEY, lastScrapedAt);
      }
    } catch {
      // 無視
    }
    setUpdateCounts(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <Header
        search={store.filter.search}
        onSearchChange={(search) => store.updateFilter({ search })}
        columns={store.columns}
        onColumnsChange={store.setColumns}
        totalCount={store.totalCount}
        filteredCount={store.filteredSites.length}
        filter={store.filter}
        updateFilter={store.updateFilter}
        eagleStatus={eagle.status}
        eagleLastSyncAt={eagle.lastSyncAt}
        eagleItemCount={eagle.itemCount}
        onEagleRefresh={() => void eagle.refresh()}
        hideEagleDuplicates={store.hideEagleDuplicates}
        onToggleHideEagleDuplicates={store.toggleHideEagleDuplicates}
      />

      {/* Eagle重複セカンダリバー（トグルで ON/OFF 切替可能） */}
      <EagleExcludedBar
        excludedCount={store.eagleExcludedSites.length}
        onOpenExcluded={() => setShowEagleExcluded(true)}
        visible={store.hideEagleDuplicates && store.eagleExcludedSites.length > 0}
        hideEagleDuplicates={store.hideEagleDuplicates}
      />

      {/* フィルターバー（ソースタブ + お気に入り + エージェンシー + 日付） */}
      <FilterBar
        filter={store.filter}
        updateFilter={store.updateFilter}
        toggleSource={store.toggleSource}
        onClearSources={() => store.updateFilter({ sources: [] })}
        resetFilter={store.resetFilter}
        signalCounts={store.signalCounts}
      />

      {/* ギャラリー */}
      <Gallery
        sites={store.filteredSites}
        columns={store.columns}
        selectedIds={store.selectedIds}
        onSelect={store.handleSelect}
        onToggleStar={store.toggleStar}
        onSetStarredMany={store.setStarredMany}
        onClearSelection={store.clearSelection}
        onColumnsChange={store.setColumns}
      />

      {/* 更新通知モーダル */}
      {updateCounts && (
        <UpdateNotificationModal
          counts={updateCounts}
          onClose={handleCloseModal}
        />
      )}

      {/* Eagle重複で非表示中の一覧モーダル */}
      {showEagleExcluded && (
        <EagleExcludedModal
          sites={store.eagleExcludedSites}
          onClose={() => setShowEagleExcluded(false)}
        />
      )}
    </div>
  );
}
