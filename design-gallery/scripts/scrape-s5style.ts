/**
 * S5-Style 専用スクレイパー
 *
 * https://www.s5-style.com/ は Next.js + 専用 API のサイト。
 * フロントが叩いている内部 API がそのまま叩けるので、JSON で
 * きれいなデータを取れる:
 *   GET https://api.s5-style.com/posts/?offset=N&limit=100
 *   → { count: 8588, items: [ { id, title, site_url, images, categories, types, styles, ... } ] }
 *
 * 同類スクレイパーと違って HTML パース不要、画像 webp は CDN 直リンク、
 * site_url が「実際の紹介サイト」(外部リンク)。
 *
 * 使い方:
 *   npx tsx scripts/scrape-s5style.ts
 *   MAX_S5STYLE=500 npx tsx scripts/scrape-s5style.ts
 */
import * as crypto from "crypto";

export interface ScrapedS5StyleSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "s5style";
  category: string[];
  taste: string[];
  agency?: string;
  date: string; // YYYY-MM
  starred: boolean;
}

interface S5ApiTag {
  id: number;
  label: string;
  posts_count: number;
}

interface S5ApiItem {
  id: number;
  title: string;
  site_url: string;
  images: { l?: string; m?: string; s?: string };
  categories: S5ApiTag[];   // 業種 (IT, 不動産, ...)
  styles: S5ApiTag[];        // テイスト (シンプル, グラフィカル, ...)
  colors: S5ApiTag[];
  technologies: S5ApiTag[];  // CSS, HTML5, React, ...
  types: S5ApiTag[];         // 採用サイト, コーポレートサイト, ...
  author?: { display_name?: string };
  sets_count?: number;
  is_gd?: boolean;
}

interface S5ApiResponse {
  items: S5ApiItem[];
  count: number;
}

const PAGE_LIMIT = 100;
const SLEEP_MS = 800; // API 配慮

function generateId(siteUrl: string): string {
  return crypto.createHash("md5").update(`s5style:${siteUrl}`).digest("hex").slice(0, 12);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(offset: number): Promise<S5ApiResponse> {
  const url = `https://api.s5-style.com/posts/?offset=${offset}&limit=${PAGE_LIMIT}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json,*/*;q=0.8",
      Referer: "https://www.s5-style.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<S5ApiResponse>;
}

// S5 のラベルを既存スキーマに優しく寄せる。
// scraper 側は文字列を保持するだけ (category: string[])、UI 側で必要なら
// enrich-tags.ts が別途整える設計。なるべく日本語ラベルそのまま渡す。
function toCategoryStrings(item: S5ApiItem): string[] {
  const labels = [
    ...item.types.map((t) => t.label),
    ...item.categories.map((c) => c.label),
  ];
  return labels.length > 0 ? labels.slice(0, 5) : ["uncategorized"];
}

function toTasteStrings(item: S5ApiItem): string[] {
  return item.styles.map((s) => s.label).slice(0, 5);
}

/**
 * S5-Style の API を叩いて 指定件数まで取得する。
 * - 新しい順 (id 降順) で取れる
 * - 重複は内部 Set で URL ベースに弾く
 * - 同じ site_url の別エントリが あれば 最初に出会った方を採用
 */
export async function scrapeS5Style(targetCount: number = 500): Promise<ScrapedS5StyleSite[]> {
  console.log(`\n📝 S5-Style からスクレイピング開始 (目標 ${targetCount} 件)`);
  const sites: ScrapedS5StyleSite[] = [];
  const seen = new Set<string>();

  // 今月を date のフォールバックに。S5 API は published_at を返さないので、
  // 「新規にスクレイプで掴んだサイト = ほぼ最近の掲載」と割り切る。
  // 古いものは CUTOFF_DATE (2024-01) で 全体スクリプト側でドロップされる。
  const todayMonth = new Date().toISOString().slice(0, 7);

  let offset = 0;
  let totalCount = Infinity;
  let pageNo = 1;

  while (sites.length < targetCount && offset < totalCount) {
    try {
      const res = await fetchPage(offset);
      totalCount = res.count;
      if (res.items.length === 0) break;

      for (const item of res.items) {
        if (!item.site_url || !item.title) continue;
        // 画像が無いと UI で grid が割れるので、ない場合は skip
        const thumb = item.images?.l || item.images?.m || item.images?.s;
        if (!thumb) continue;
        if (seen.has(item.site_url)) continue;
        seen.add(item.site_url);
        sites.push({
          id: generateId(item.site_url),
          title: item.title.slice(0, 100),
          url: item.site_url,
          thumbnailUrl: thumb,
          source: "s5style",
          category: toCategoryStrings(item),
          taste: toTasteStrings(item),
          date: todayMonth,
          starred: false,
        });
        if (sites.length >= targetCount) break;
      }

      console.log(`  page ${pageNo} (offset ${offset}): ${sites.length} 件 / 目標 ${targetCount} (total: ${totalCount})`);
      offset += PAGE_LIMIT;
      pageNo += 1;
      await sleep(SLEEP_MS);
    } catch (e) {
      console.error(`  ⚠️  offset ${offset} エラー:`, (e as Error).message);
      // 1 度リトライ
      await sleep(SLEEP_MS * 2);
      try {
        const res = await fetchPage(offset);
        totalCount = res.count;
        for (const item of res.items) {
          if (!item.site_url || !item.title) continue;
          const thumb = item.images?.l || item.images?.m || item.images?.s;
          if (!thumb) continue;
          if (seen.has(item.site_url)) continue;
          seen.add(item.site_url);
          sites.push({
            id: generateId(item.site_url),
            title: item.title.slice(0, 100),
            url: item.site_url,
            thumbnailUrl: thumb,
            source: "s5style",
            category: toCategoryStrings(item),
            taste: toTasteStrings(item),
            date: todayMonth,
            starred: false,
          });
        }
        offset += PAGE_LIMIT;
        pageNo += 1;
      } catch (e2) {
        console.error(`  ❌  リトライ失敗:`, (e2 as Error).message);
        break;
      }
    }
  }

  console.log(`  ✅ 取得完了: ${sites.length} 件`);
  return sites;
}

// スタンドアロン実行
if (require.main === module) {
  const target = parseInt(process.env.MAX_S5STYLE || "500", 10);
  scrapeS5Style(target)
    .then((sites) => {
      console.log(`\n✅ 完了: ${sites.length} 件`);
      console.log("最初の3件:", sites.slice(0, 3));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
