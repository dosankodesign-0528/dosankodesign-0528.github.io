"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { Gallery } from "@/components/Gallery";
import { UpdateNotificationModal } from "@/components/UpdateNotificationModal";
import { HiddenSitesModal } from "@/components/HiddenSitesModal";
import { useGalleryStore } from "@/hooks/useGalleryStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEagleSync } from "@/hooks/useEagleSync";
import { lastScrapedAt } from "@/data/load-sites";
import { SourceSite } from "@/types";

const LAST_SEEN_KEY = "design-gallery:lastSeenAt";
// モーダルを最後に閉じた時刻。これから DAILY_QUIET_MS の間は再表示しない。
// "毎回出るとうざい、1日1回見たら閉じてOK" という要望に対応。
const MODAL_DISMISSED_AT_KEY = "design-gallery:updateModalDismissedAt";
const DAILY_QUIET_MS = 24 * 60 * 60 * 1000;

export default function Home() {
  const eagle = useEagleSync();
  const store = useGalleryStore({ eagleUrls: eagle.eagleUrls });
  const [updateCounts, setUpdateCounts] = useState<Partial<
    Record<SourceSite, number>
  > | null>(null);
  const [showHiddenManager, setShowHiddenManager] = useState(false);

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

      // 直近 24h 以内に閉じてたら何もしない（うざがられないように）
      const dismissedAt = localStorage.getItem(MODAL_DISMISSED_AT_KEY);
      if (dismissedAt) {
        const since = Date.now() - new Date(dismissedAt).getTime();
        if (Number.isFinite(since) && since >= 0 && since < DAILY_QUIET_MS) {
          return;
        }
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
      // 「今日はもう見た」マーカーを記録 → 24h 以内は再表示しない
      localStorage.setItem(MODAL_DISMISSED_AT_KEY, new Date().toISOString());
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
        filteredIds={store.filteredSites.map((s) => s.id)}
        onHideMany={store.hideMany}
        onOpenHiddenManager={() => setShowHiddenManager(true)}
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

      {/* 非表示の管理モーダル（Eagle重複 + 自分で非表示の統合） */}
      {showHiddenManager && (
        <HiddenSitesModal
          sites={store.hiddenSites}
          onClose={() => setShowHiddenManager(false)}
          onUnhideOne={store.unhideOne}
          onUnhideAll={store.unhideAll}
          eagleStatus={eagle.status}
          eagleItemCount={eagle.itemCount}
          eagleExcludedSites={store.eagleExcludedSites}
          hideEagleDuplicates={store.hideEagleDuplicates}
          onToggleHideEagleDuplicates={store.toggleHideEagleDuplicates}
          onEagleRefresh={() => void eagle.refresh()}
        />
      )}
    </div>
  );
}
