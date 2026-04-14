/**
 * 既存の scraped-sites.json に isAgency フラグを付与するパッチスクリプト
 *
 * - SANKOU! の「制作･開発･企画」カテゴリページからURL一覧を取得
 * - Web Design Clip の「デザイン事務所・制作会社」カテゴリのエントリーにもフラグ付与
 *
 * 使い方: npx tsx scripts/patch-agency.ts
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
 * SANKOU! の特定カテゴリページから全URLを取得
 */
async function scrapeSankouCategoryUrls(categorySlug: string, maxPages: number = 10): Promise<Set<string>> {
  const urls = new Set<string>();
  const baseUrl = `https://sankoudesign.com/category/${categorySlug}/`;

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      $("article li").each((_, el) => {
        const $el = $(el);
        const $figure = $el.find("figure");
        if ($figure.length === 0) return;

        const siteUrl = $figure.find("a[target='_blank']").attr("href") || "";
        if (siteUrl && siteUrl.startsWith("http")) {
          urls.add(normalizeUrl(siteUrl));
        }
      });

      console.log(`  カテゴリ [${categorySlug}] ページ ${page}: 累計 ${urls.size} URL`);

      // 次のページがあるか確認
      const hasNext = $("a.next, .page-numbers").last().text().includes("NEXT") ||
        $(`a[href*="/page/${page + 1}"]`).length > 0;
      if (!hasNext) {
        console.log(`  最終ページ到達`);
        break;
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("404")) {
        console.log(`  ページ ${page}: 最終ページ到達 (404)`);
        break;
      }
      console.error(`  ページ ${page} エラー:`, msg);
    }

    await sleep(1500);
  }

  return urls;
}

async function main() {
  console.log("🏢 制作会社フラグ パッチ開始");
  console.log("=".repeat(50));

  // 既存データ読み込み
  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  console.log(`📊 既存データ: ${sites.length}件`);

  // SANKOU! の制作会社カテゴリURLを取得
  console.log("\n📝 SANKOU! 制作会社カテゴリを取得...");
  const agencyUrls = await scrapeSankouCategoryUrls("production-agency-portfolio", 10);
  console.log(`  → ${agencyUrls.size} URLを取得`);

  // デザイン・創作カテゴリも取得（デザイン事務所系）
  console.log("\n📝 SANKOU! デザイン・創作カテゴリを取得...");
  const designUrls = await scrapeSankouCategoryUrls("design-manufacturing-photo", 10);
  console.log(`  → ${designUrls.size} URLを取得`);

  // 両方のURLを統合
  const allAgencyUrls = new Set([...agencyUrls, ...designUrls]);
  console.log(`\n📊 制作会社系URL合計: ${allAgencyUrls.size}件（重複込み: ${agencyUrls.size} + ${designUrls.size}）`);

  // Web Design Clip の制作会社カテゴリ名
  const wdcAgencyCategories = ["デザイン事務所・制作会社"];

  // パッチ適用
  let patchedCount = 0;
  for (const site of sites) {
    const normalized = normalizeUrl(site.url);

    // SANKOU! カテゴリマッチ
    if (allAgencyUrls.has(normalized)) {
      site.isAgency = true;
      patchedCount++;
      continue;
    }

    // Web Design Clip カテゴリマッチ
    if (site.source === "webdesignclip" &&
      site.category.some((c) => wdcAgencyCategories.includes(c))) {
      site.isAgency = true;
      patchedCount++;
      continue;
    }

    // デフォルトは false
    site.isAgency = false;
  }

  console.log(`\n✅ パッチ完了: ${patchedCount}件を制作会社としてマーク`);

  // ソース別の内訳
  const bySrc: Record<string, { total: number; agency: number }> = {};
  for (const site of sites) {
    if (!bySrc[site.source]) bySrc[site.source] = { total: 0, agency: 0 };
    bySrc[site.source].total++;
    if (site.isAgency) bySrc[site.source].agency++;
  }
  for (const [src, counts] of Object.entries(bySrc)) {
    console.log(`  ${src}: ${counts.agency}/${counts.total}件が制作会社`);
  }

  // 保存
  fs.writeFileSync(DATA_PATH, JSON.stringify(sites, null, 2), "utf-8");
  console.log(`\n💾 保存完了: ${DATA_PATH}`);
}

main().catch(console.error);
