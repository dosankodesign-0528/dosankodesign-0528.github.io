/**
 * 既存の scraped-sites.json の日付を各キュレーションサイトの実際の掲載日で更新する
 *
 * - SANKOU!: リストページの日付要素から取得
 * - Web Design Clip: 既にスクレイピング済み（そのまま）
 * - MUUUUU.ORG: リストページに日付がないためスキップ
 *
 * 使い方: npx tsx scripts/patch-dates.ts
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

interface ScrapedSite {
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
}

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");

async function fetchPage(url: string): Promise<string> {
  console.log(`  取得中: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ja,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const p = u.pathname.replace(/\/$/, "").toLowerCase();
    return `${host}${p}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").toLowerCase();
  }
}

/**
 * SANKOU! の全ページから URL→日付 のマップを構築
 */
async function scrapeSankouDates(maxPages: number = 30): Promise<Map<string, string>> {
  const dateMap = new Map<string, string>();

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? "https://sankoudesign.com/" : `https://sankoudesign.com/page/${page}/`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      $("article li").each((_, el) => {
        const $el = $(el);
        const $figure = $el.find("figure");
        if ($figure.length === 0) return;

        // URL
        const siteUrl = $figure.find("a[target='_blank']").attr("href") || "";
        if (!siteUrl || !siteUrl.startsWith("http")) return;

        // 日付（list_time を含むクラスの要素）
        const dateEl = $el.find("[class*='list_time']");
        const dateText = dateEl.text().trim(); // "2024/10/29" 形式

        if (dateText) {
          // YYYY/MM/DD → YYYY-MM に変換
          const match = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (match) {
            const dateStr = `${match[1]}-${match[2].padStart(2, "0")}`;
            dateMap.set(normalizeUrl(siteUrl), dateStr);
          }
        }
      });

      console.log(`  ページ ${page}: 累計 ${dateMap.size} 件の日付を取得`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("404")) {
        console.log(`  ページ ${page}: 最終ページ到達`);
        break;
      }
      console.error(`  ページ ${page} エラー:`, msg);
    }

    await sleep(1200);
  }

  return dateMap;
}

async function main() {
  console.log("📅 日付パッチ開始");
  console.log("=".repeat(50));

  // 既存データ読み込み
  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  console.log(`📊 既存データ: ${sites.length}件`);

  // SANKOU! の日付を取得
  console.log("\n📝 SANKOU! から日付を取得...");
  const sankouDates = await scrapeSankouDates(30);
  console.log(`  → ${sankouDates.size} 件の日付を取得`);

  // パッチ適用
  let patchedCount = 0;
  let skippedCount = 0;

  for (const site of sites) {
    if (site.source !== "sankou") continue;

    const normalized = normalizeUrl(site.url);
    const newDate = sankouDates.get(normalized);

    if (newDate) {
      site.date = newDate;
      patchedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ パッチ完了:`);
  console.log(`  SANKOU! 日付更新: ${patchedCount}件`);
  console.log(`  マッチしなかった: ${skippedCount}件`);

  // 日付分布の確認
  const dateCounts: Record<string, number> = {};
  for (const site of sites) {
    if (site.source === "sankou") {
      const ym = site.date;
      dateCounts[ym] = (dateCounts[ym] || 0) + 1;
    }
  }
  console.log("\n📊 SANKOU! 日付分布（上位10）:");
  const sorted = Object.entries(dateCounts).sort((a, b) => b[0].localeCompare(a[0]));
  for (const [date, count] of sorted.slice(0, 10)) {
    console.log(`  ${date}: ${count}件`);
  }

  // 保存
  fs.writeFileSync(DATA_PATH, JSON.stringify(sites, null, 2), "utf-8");
  console.log(`\n💾 保存完了: ${DATA_PATH}`);
}

main().catch(console.error);
