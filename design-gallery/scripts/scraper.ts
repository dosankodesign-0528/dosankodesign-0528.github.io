/**
 * デザインギャラリー スクレイパー
 * 4サイトからデータを収集し、JSON に保存する
 *
 * 使い方: npx tsx scripts/scraper.ts
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { scrape81Web as scrape81WebPlaywright } from "./scrape-81web";

// ============================================================
// 型定義
// ============================================================
interface ScrapedSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "sankou" | "81web" | "muuuuu" | "awwwards" | "webdesignclip";
  category: string[];
  taste: string[];
  agency?: string;
  date: string; // YYYY-MM
  starred: boolean;
}

// ============================================================
// ユーティリティ
// ============================================================
function generateId(url: string, source: string): string {
  return crypto
    .createHash("md5")
    .update(`${source}:${url}`)
    .digest("hex")
    .slice(0, 12);
}

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

// ============================================================
// SANKOU! (sankoudesign.com) スクレイパー
// ============================================================
async function scrapeSankou(pages: number = 3): Promise<ScrapedSite[]> {
  console.log("\n📝 SANKOU! からスクレイピング開始...");
  const results: ScrapedSite[] = [];

  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? "https://sankoudesign.com/" : `https://sankoudesign.com/page/${page}/`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // SANKOU! の構造:
      // article > ul > li > figure > a[href=実サイトURL] > img[alt=タイトル]
      // + div[class^="site_more"] > p > a にタイトルとURL
      $("article li").each((_, el) => {
        const $el = $(el);
        const $figure = $el.find("figure");
        if ($figure.length === 0) return;

        // サムネイル画像（data-src を優先、なければ src）
        const $img = $figure.find("img.wp-post-image").first();
        const img = $img.attr("data-src") || $img.attr("src") || "";
        if (!img || img.startsWith("data:")) return;

        // タイトル（imgのalt属性から取得）
        const title = $img.attr("alt")?.trim() || "";
        if (!title) return;

        // 実サイトURL（figureの最初のa[target=_blank]）
        const siteUrl = $figure.find("a[target='_blank']").attr("href") || "";

        // 詳細ページURL
        const detailUrl = $figure.find("a.detail-link").attr("href") || "";

        if (title && img) {
          results.push({
            id: generateId(siteUrl || img, "sankou"),
            title: title.slice(0, 100),
            url: siteUrl || (detailUrl.startsWith("http") ? detailUrl : `https://sankoudesign.com${detailUrl}`),
            thumbnailUrl: img.startsWith("http") ? img : `https://sankoudesign.com${img}`,
            source: "sankou",
            category: ["uncategorized"],
            taste: [],
            date: new Date().toISOString().slice(0, 7),
            starred: false,
          });
        }
      });

      console.log(`  ページ ${page}: ${results.length} 件取得`);
    } catch (e) {
      console.error(`  ページ ${page} エラー:`, (e as Error).message);
    }

    await sleep(1500);
  }

  return results;
}

// ============================================================
// MUUUUU.ORG スクレイパー
// ============================================================
async function scrapeMuuuuu(pages: number = 3): Promise<ScrapedSite[]> {
  console.log("\n📝 MUUUUU.ORG からスクレイピング開始...");
  const results: ScrapedSite[] = [];

  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? "https://muuuuu.org/" : `https://muuuuu.org/page/${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // MUUUUU.ORG はリスト形式
      $("article, li, .entry, .post").each((_, el) => {
        const $el = $(el);

        // サムネイル
        const img =
          $el.find("img").attr("src") ||
          $el.find("img").attr("data-src");
        if (!img || img.startsWith("data:") || img.includes("icon") || img.includes("logo")) return;

        // タイトル
        const title = ($el.find("h2, h3").first().text().trim() || $el.find("a").first().text().trim());
        if (!title || title.length < 2) return;

        // URL
        const siteUrl =
          $el.find("a[target='_blank']").attr("href") ||
          $el.find("a").attr("href") ||
          "";

        // カテゴリ
        const cats: string[] = [];
        $el.find("a[rel='tag'], .category a, .tag").each((_, catEl) => {
          const t = $(catEl).text().trim();
          if (t && t.length < 30) cats.push(t);
        });

        // エージェンシー（Credit By の後）
        const creditText = $el.text();
        const creditMatch = creditText.match(/Credit\s*(?:By|by|:)\s*(.+?)(?:\n|$)/);
        const agency = creditMatch ? creditMatch[1].trim().slice(0, 50) : undefined;

        if (title && img) {
          results.push({
            id: generateId(siteUrl || img, "muuuuu"),
            title: title.slice(0, 100),
            url: siteUrl.startsWith("http") ? siteUrl : `https://muuuuu.org${siteUrl}`,
            thumbnailUrl: img.startsWith("http") ? img : `https://muuuuu.org${img}`,
            source: "muuuuu",
            category: cats.length > 0 ? cats : ["uncategorized"],
            taste: [],
            agency,
            date: new Date().toISOString().slice(0, 7),
            starred: false,
          });
        }
      });

      console.log(`  ページ ${page}: ${results.length} 件取得`);
    } catch (e) {
      console.error(`  ページ ${page} エラー:`, (e as Error).message);
    }

    await sleep(1500);
  }

  return results;
}

// ============================================================
// 81-web.com スクレイパー（Vue.jsアプリなのでAPI的にデータ取得を試みる）
// ============================================================
async function scrape81Web(pages: number = 3): Promise<ScrapedSite[]> {
  console.log("\n📝 81-web.com からスクレイピング開始...");
  const results: ScrapedSite[] = [];

  try {
    // 81-web.comはVue.js + WordPressベース。
    // WordPress REST API を試す
    for (let page = 1; page <= pages; page++) {
      try {
        const apiUrl = `https://81-web.com/wp-json/wp/v2/posts?per_page=20&page=${page}&_embed`;
        const res = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const posts = (await res.json()) as Array<{
            title?: { rendered?: string };
            link?: string;
            acf?: Record<string, unknown>;
            _embedded?: {
              "wp:featuredmedia"?: Array<{ source_url?: string }>;
            };
            date?: string;
            [key: string]: unknown;
          }>;
          for (const post of posts) {
            const title =
              (post.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
            const thumbnail =
              post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";

            if (title && thumbnail) {
              results.push({
                id: generateId(post.link || title, "81web"),
                title,
                url: (post.link as string) || `https://81-web.com/`,
                thumbnailUrl: thumbnail,
                source: "81web",
                category: ["uncategorized"],
                taste: [],
                date: post.date
                  ? (post.date as string).slice(0, 7)
                  : new Date().toISOString().slice(0, 7),
                starred: false,
              });
            }
          }
          console.log(`  API ページ ${page}: ${results.length} 件取得`);
        } else {
          console.log(`  API 非対応 (${res.status})。HTMLフォールバック...`);
          // HTML からインラインデータを抽出
          const html = await fetchPage("https://81-web.com/");
          const $ = cheerio.load(html);

          // Vue.js のインラインデータを探す
          $("script").each((_, el) => {
            const text = $(el).html() || "";
            // JSON データを探す
            const match = text.match(/posts\s*[:=]\s*(\[[\s\S]*?\])/);
            if (match) {
              try {
                const posts = JSON.parse(match[1]);
                for (const post of posts) {
                  if (post.title && post.thumbnail) {
                    results.push({
                      id: generateId(post.url || post.title, "81web"),
                      title: post.title,
                      url: post.url || "https://81-web.com/",
                      thumbnailUrl: post.thumbnail,
                      source: "81web",
                      category: post.categories || ["uncategorized"],
                      taste: [],
                      agency: post.agency,
                      date: post.date || new Date().toISOString().slice(0, 7),
                      starred: false,
                    });
                  }
                }
              } catch {
                // パース失敗
              }
            }
          });
          break; // HTML フォールバックは1回のみ
        }
      } catch (e) {
        console.error(`  ページ ${page} エラー:`, (e as Error).message);
      }
      await sleep(1500);
    }
  } catch (e) {
    console.error("  81-web.com エラー:", (e as Error).message);
  }

  return results;
}

// ============================================================
// Awwwards スクレイパー
// ============================================================
async function scrapeAwwwards(pages: number = 2): Promise<ScrapedSite[]> {
  console.log("\n📝 Awwwards からスクレイピング開始...");
  const results: ScrapedSite[] = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://www.awwwards.com/websites/?page=${page}`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // Awwwards のサイトカードを探す
      $("li, article, .js-collectable, [data-id]").each((_, el) => {
        const $el = $(el);

        // サムネイル
        const img =
          $el.find("img").attr("src") ||
          $el.find("img").attr("data-src") ||
          $el.find("img").attr("data-original");
        if (!img || img.startsWith("data:") || img.length < 10) return;

        // タイトル
        const title = (
          $el.find("h2, h3, .title, .heading").first().text().trim() ||
          $el.find("a").first().text().trim()
        );
        if (!title || title.length < 2 || title.length > 100) return;

        // URL
        const siteUrl = $el.find("a").attr("href") || "";

        // カテゴリ
        const cats: string[] = [];
        $el.find(".budget-tag, .tag, .category").each((_, catEl) => {
          const t = $(catEl).text().trim();
          if (t && t.length < 30) cats.push(t);
        });

        if (title && img) {
          results.push({
            id: generateId(siteUrl || img, "awwwards"),
            title: title.slice(0, 100),
            url: siteUrl.startsWith("http")
              ? siteUrl
              : siteUrl.startsWith("/")
                ? `https://www.awwwards.com${siteUrl}`
                : siteUrl,
            thumbnailUrl: img.startsWith("http")
              ? img
              : img.startsWith("//")
                ? `https:${img}`
                : `https://www.awwwards.com${img}`,
            source: "awwwards",
            category: cats.length > 0 ? cats : ["web design"],
            taste: [],
            date: new Date().toISOString().slice(0, 7),
            starred: false,
          });
        }
      });

      console.log(`  ページ ${page}: ${results.length} 件取得`);
    } catch (e) {
      console.error(`  ページ ${page} エラー:`, (e as Error).message);
    }

    await sleep(2000); // awwwards は少し長めに待つ
  }

  return results;
}

// ============================================================
// Web Design Clip スクレイパー（4サブドメイン）
// ============================================================
const WDC_SECTIONS = [
  { name: "Japan", baseUrl: "https://webdesignclip.com" },
  { name: "World", baseUrl: "https://world.webdesignclip.com" },
  { name: "Landing Page", baseUrl: "https://lp.webdesignclip.com" },
  { name: "Smartphone", baseUrl: "https://sp.webdesignclip.com" },
];

async function scrapeWebDesignClip(pagesPerSection: number = 10): Promise<ScrapedSite[]> {
  console.log("\n📝 Web Design Clip からスクレイピング開始...");
  const results: ScrapedSite[] = [];

  for (const section of WDC_SECTIONS) {
    console.log(`  [${section.name}] ${section.baseUrl}`);

    for (let page = 1; page <= pagesPerSection; page++) {
      const url = page === 1 ? `${section.baseUrl}/` : `${section.baseUrl}/page/${page}/`;
      try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        $("li.post_li:not(.post_ad)").each((_, el) => {
          const $el = $(el);

          // サムネイル
          const img = $el.find(".post_img img").attr("src") || $el.find(".post_img img").attr("data-src") || "";
          if (!img || img.startsWith("data:")) return;

          // タイトル
          const title = ($el.find("figcaption.post_title h2 a").attr("title") ||
            $el.find("figcaption.post_title h2 a").text().trim() || "");
          if (!title) return;

          // サイトURL（実際のウェブサイト）
          const siteUrl = $el.find(".post_inner--launch a").attr("href") ||
            $el.find("figcaption.post_title h2 a").attr("href") || "";
          if (!siteUrl || !siteUrl.startsWith("http")) return;

          // カテゴリ
          const cats: string[] = [];
          $el.find(".post_inner--category a").each((_, catEl) => {
            const t = $(catEl).text().trim();
            if (t && t.length < 30) cats.push(t);
          });

          // 日付
          let dateStr = new Date().toISOString().slice(0, 7);
          const timeEl = $el.find(".post_inner--date time");
          const dateP = $el.find(".post_inner--date");
          if (timeEl.length > 0 && timeEl.attr("datetime")) {
            dateStr = timeEl.attr("datetime")!.slice(0, 7);
          } else if (dateP.length > 0) {
            const dateText = dateP.text().trim();
            // "Apr 13, 2026" 形式をパース
            const parsed = new Date(dateText);
            if (!isNaN(parsed.getTime())) {
              dateStr = parsed.toISOString().slice(0, 7);
            }
          }

          results.push({
            id: generateId(siteUrl, "webdesignclip"),
            title: title.slice(0, 100),
            url: siteUrl,
            thumbnailUrl: img.startsWith("http") ? img : `${section.baseUrl}${img}`,
            source: "webdesignclip",
            category: cats.length > 0 ? cats : ["uncategorized"],
            taste: [],
            date: dateStr,
            starred: false,
          });
        });

        console.log(`  [${section.name}] ページ ${page}: 累計 ${results.length} 件`);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("404")) {
          console.log(`  [${section.name}] ページ ${page}: 最終ページ到達`);
          break; // 404なら最終ページ
        }
        console.error(`  [${section.name}] ページ ${page} エラー:`, msg);
      }

      await sleep(1500);
    }
  }

  return results;
}

// ============================================================
// 重複排除
// ============================================================
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // www有無を統一、末尾スラッシュ除去、小文字化
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").toLowerCase();
  }
}

function deduplicateByUrl(sites: ScrapedSite[]): ScrapedSite[] {
  const seen = new Set<string>();
  return sites.filter((site) => {
    const normalized = normalizeUrl(site.url);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// ============================================================
// メイン実行
// ============================================================
async function main() {
  console.log("🚀 デザインギャラリー スクレイパー起動");
  console.log("=".repeat(50));

  const allResults: ScrapedSite[] = [];

  // 各スクレイパーを実行（順番に。並列だとサーバーに負荷かかるので）
  const sankouResults = await scrapeSankou(30);
  allResults.push(...sankouResults);

  const muuuuuResults = await scrapeMuuuuu(30);
  allResults.push(...muuuuuResults);

  const wdcResults = await scrapeWebDesignClip(200);
  allResults.push(...wdcResults);

  // 81-web.com は Nuxt3 SPA なので Playwright で取得
  const target81 = parseInt(process.env.MAX_81WEB_SITES || "2000", 10);
  const web81Results = await scrape81WebPlaywright(target81);
  allResults.push(...web81Results);

  // 重複排除（URLベースでソース横断）
  const deduplicated = deduplicateByUrl(allResults);

  console.log("\n" + "=".repeat(50));
  console.log(`📊 結果サマリー:`);
  console.log(`  SANKOU!:          ${sankouResults.length} 件`);
  console.log(`  MUUUUU.ORG:       ${muuuuuResults.length} 件`);
  console.log(`  Web Design Clip:  ${wdcResults.length} 件`);
  console.log(`  81-web.com:       ${web81Results.length} 件`);
  console.log(`  合計:             ${allResults.length} 件`);
  console.log(`  重複排除後:       ${deduplicated.length} 件`);

  // JSON保存
  const outputPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  fs.writeFileSync(outputPath, JSON.stringify(deduplicated, null, 2), "utf-8");
  console.log(`\n✅ 保存完了: ${outputPath}`);
}

main().catch(console.error);
