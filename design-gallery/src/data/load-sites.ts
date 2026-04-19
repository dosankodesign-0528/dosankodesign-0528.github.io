import { SiteEntry } from "@/types";
import { sampleSites } from "./sample-sites";

// スクレイピングデータを読み込む（存在すればそちらを使い、サンプルデータとマージ）
let scrapedSites: SiteEntry[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require("./scraped-sites.json") as Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    source: string;
    category: string[];
    taste: string[];
    agency?: string;
    date: string;
    starred: boolean;
    isAgency?: boolean;
    firstSeen?: string;
  }>;
  scrapedSites = data.map((item) => ({
    ...item,
    source: item.source as SiteEntry["source"],
    category: item.category as SiteEntry["category"],
    taste: item.taste as SiteEntry["taste"],
    isAgency: item.isAgency ?? false,
  }));
} catch {
  // スクレイピングデータがなければサンプルのみ使用
  console.log("scraped-sites.json not found, using sample data only");
}

// マージ: スクレイピングデータ + サンプルデータ（81-web分を補完）
const sampleFor81webAndAwwwards = sampleSites.filter(
  (s) => s.source === "81web"
);

// URLベースで重複排除
const urlSet = new Set<string>();
const merged: SiteEntry[] = [];

for (const site of [...scrapedSites, ...sampleFor81webAndAwwwards]) {
  const normalizedUrl = site.url.replace(/\/$/, "").toLowerCase();
  if (!urlSet.has(normalizedUrl)) {
    urlSet.add(normalizedUrl);
    merged.push(site);
  }
}

/** 全サイトデータ */
export const allSites: SiteEntry[] = merged;

/** 日付範囲 */
export const dateRange: [string, string] = (() => {
  const dates = allSites.map((s) => s.date).sort();
  return [dates[0] || "2020-01", dates[dates.length - 1] || "2026-04"];
})();

/** スクリーンショットが存在するサイトIDのセット */
export const screenshotIds: Set<string> = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ids = require("./screenshot-ids.json") as string[];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
})();

/** 最終スクレイプ時刻（ISO）。更新通知モーダルのベースラインに使う */
export const lastScrapedAt: string | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const meta = require("./scrape-meta.json") as { scrapedAt: string };
    return meta.scrapedAt ?? null;
  } catch {
    return null;
  }
})();
