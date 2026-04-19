"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchEagleLibrary,
  loadEagleCache,
  saveEagleCache,
  type EagleCache,
} from "@/lib/eagle";

export type EagleStatus =
  | "idle"      // 初期（何もしてない）
  | "syncing"   // 同期中
  | "live"      // Eagle起動中で最新を取れた
  | "cached"    // Eagle未起動だがキャッシュで動作中
  | "empty";    // キャッシュも無く接続もできず（初回 & Eagle閉）

/**
 * Eagle同期フック。
 * - マウント時にキャッシュを即時反映（UXを止めない）
 * - 同時にライブ取得を試行
 * - ライブ取得できたらキャッシュを更新
 * - refresh() で手動同期も可能
 */
export function useEagleSync() {
  const [eagleUrls, setEagleUrls] = useState<Set<string>>(new Set());
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [status, setStatus] = useState<EagleStatus>("idle");

  const applyCache = useCallback((cache: EagleCache) => {
    setEagleUrls(new Set(cache.urls));
    setLastSyncAt(cache.fetchedAt);
    setItemCount(cache.count);
  }, []);

  const refresh = useCallback(async () => {
    setStatus((prev) => (prev === "idle" || prev === "empty" ? "syncing" : prev));
    const fresh = await fetchEagleLibrary();
    if (fresh) {
      applyCache(fresh);
      saveEagleCache(fresh);
      setStatus("live");
      return "live" as const;
    }
    // Eagle閉/API落ち: キャッシュフォールバック
    const cached = loadEagleCache();
    if (cached) {
      applyCache(cached);
      setStatus("cached");
      return "cached" as const;
    }
    setStatus("empty");
    return "empty" as const;
  }, [applyCache]);

  useEffect(() => {
    // 1) 先にキャッシュ反映（体感速度のため）
    const cached = loadEagleCache();
    if (cached) {
      applyCache(cached);
      setStatus("cached");
    }
    // 2) ライブ同期を試す
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { eagleUrls, lastSyncAt, itemCount, status, refresh };
}
