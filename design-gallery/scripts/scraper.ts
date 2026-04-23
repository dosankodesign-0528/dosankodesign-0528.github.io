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
import { scrapeMuuuuu as scrapeMuuuuuPlaywright } from "./scrape-muuuuu";

// ============================================================
// 設定
// ============================================================
// 古いサイトは既に確認済みなのでスクレイプ対象から外す
// (YYYY-MM 形式。この月より前の date を持つエントリは最終出力から除外)
const CUTOFF_DATE = "2024-01";

// Eagle ローカル API（起動中なら localhost:41595 で叩ける）
const EAGLE_API = "http://localhost:41595/api/item/list?limit=10000";

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
  firstSeen?: string; // ISO datetime, 初めて取得した時刻
  isDead?: boolean;
  lastCheckedAt?: string;
  // 以下は enrich-tags.ts が埋める領域。スクレイプ時点で確実に分かる場合は
  // ここで先出ししておく（例: Awwwards の Framer 棚から来たものは framer 確定）
  signals?: string[];
  enrichedAt?: string;
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
// カテゴリ取得の仕組み:
//   SANKOU! のトップ/一覧 HTML には各サイトのカテゴリ情報が入っていない。
//   ただし WordPress REST API (`/wp-json/wp/v2/posts/{id}?_embed`) に
//   post の category/taste/color タームが1リクエストで全部ぶら下がってくる。
//   トップページに `data-postid="NNNNN"` が埋まっているので、それを拾ってから
//   並列で REST を叩いて enrichment する。
async function scrapeSankou(pages: number = 3): Promise<ScrapedSite[]> {
  console.log("\n📝 SANKOU! からスクレイピング開始...");
  const results: (ScrapedSite & { sankouPostId?: number })[] = [];

  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? "https://sankoudesign.com/" : `https://sankoudesign.com/page/${page}/`;
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // SANKOU! の構造:
      // article > ul > li > figure > a[href=実サイトURL] > img[alt=タイトル]
      // + div[class^="site_more"] > p > a にタイトルとURL
      // + div[class^="time_designer"] > p[class^="list_time"] に "YYYY/MM/DD" 形式の掲載日
      // + div.simplefavorite-button[data-postid="NNNNN"] → WP の post ID
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

        // 掲載日(YYYY/MM/DD)→YYYY-MM
        let dateStr = new Date().toISOString().slice(0, 7);
        const rawDate = $el.find('p[class^="list_time"]').first().text().trim();
        const dm = rawDate.match(/^(\d{4})[/-](\d{2})/);
        if (dm) dateStr = `${dm[1]}-${dm[2]}`;

        // data-postid 取得（REST API で categories を引くキー）
        const rawPostId = $el.find("[data-postid]").first().attr("data-postid");
        const postId = rawPostId ? parseInt(rawPostId, 10) : undefined;

        if (title && img) {
          results.push({
            id: generateId(siteUrl || img, "sankou"),
            title: title.slice(0, 100),
            url: siteUrl || (detailUrl.startsWith("http") ? detailUrl : `https://sankoudesign.com${detailUrl}`),
            thumbnailUrl: img.startsWith("http") ? img : `https://sankoudesign.com${img}`,
            source: "sankou",
            category: ["uncategorized"],
            taste: [],
            date: dateStr,
            starred: false,
            sankouPostId: postId && Number.isFinite(postId) ? postId : undefined,
          });
        }
      });

      console.log(`  ページ ${page}: ${results.length} 件取得`);
    } catch (e) {
      console.error(`  ページ ${page} エラー:`, (e as Error).message);
    }

    await sleep(1500);
  }

  // WP REST API でカテゴリ enrichment（10並列）
  const withPostId = results.filter((r) => r.sankouPostId);
  console.log(`  🏷  WP REST で category 取得: ${withPostId.length}/${results.length} 件`);
  await enrichSankouCategories(withPostId);

  // 一時フィールド sankouPostId を落として返す
  return results.map(({ sankouPostId, ...rest }) => {
    void sankouPostId;
    return rest as ScrapedSite;
  });
}

/**
 * 与えられた SANKOU! サイトに対して WP REST API を並列で叩き、
 * `_embedded.wp:term` からカテゴリ名（日本語ラベル）を引いて category に詰め直す。
 *
 * SANKOU! のタクソノミーは業種・テイスト・色・技術などが全部 "category" 扱いで混在している。
 * UI 側で分離せず、とりあえず全部を `category` に入れることで、検索もフィルタもヒットしやすくする。
 * テクニカルに分類したい場合は後段で slug ベースで振り分けるのが拡張しやすい。
 */
async function enrichSankouCategories(
  sites: { sankouPostId?: number; category: string[] }[]
): Promise<void> {
  type Term = { taxonomy?: string; slug?: string; name?: string };
  type WpPost = { _embedded?: { "wp:term"?: Term[][] } };
  const CONCURRENCY = 10;
  let done = 0;
  let failed = 0;
  const total = sites.length;
  const startedAt = Date.now();

  let cursor = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < sites.length) {
      const i = cursor++;
      const site = sites[i];
      const id = site.sankouPostId;
      if (!id) continue;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(
          `https://sankoudesign.com/wp-json/wp/v2/posts/${id}?_embed=wp:term`,
          {
            headers: { "User-Agent": "design-gallery-scraper/1.0" },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (!res.ok) {
          failed++;
          continue;
        }
        const post = (await res.json()) as WpPost;
        const groups = post._embedded?.["wp:term"] ?? [];
        const names = new Set<string>();
        for (const group of groups) {
          for (const term of group) {
            if (term.name && term.taxonomy === "category") names.add(term.name);
          }
        }
        if (names.size > 0) site.category = Array.from(names);
      } catch {
        failed++;
      } finally {
        done++;
        if (done % 50 === 0 || done === total) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
          process.stdout.write(
            `\r    category enrichment: ${done}/${total} (失敗${failed}) 経過${elapsed}s  `
          );
        }
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
}

// ============================================================
// MUUUUU.ORG スクレイパー（Playwright版を呼ぶだけのラッパー）
// 旧 /page/N 方式は機能しないので scrape-muuuuu.ts に実装を分離
// ============================================================
async function scrapeMuuuuu(targetCount: number = 1500): Promise<ScrapedSite[]> {
  const raw = await scrapeMuuuuuPlaywright(targetCount);
  // 型を scraper.ts 側の ScrapedSite に合わせる
  return raw.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    thumbnailUrl: r.thumbnailUrl,
    source: "muuuuu" as const,
    category: r.category,
    taste: r.taste,
    agency: r.agency,
    date: r.date,
    starred: r.starred,
  }));
}

// ============================================================
// Eagle ローカル API から既に保存済みのURL一覧を取得
// Eagle が起動していなければ空セットを返す（スクレイプは続行）
// ============================================================
async function fetchEagleUrls(): Promise<Set<string>> {
  const result = new Set<string>();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(EAGLE_API, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      console.log(`  Eagle API 応答: HTTP ${res.status}（スキップ）`);
      return result;
    }
    const json = (await res.json()) as { data?: Array<{ url?: string; website?: string }> };
    const items = json.data || [];
    for (const it of items) {
      const u = it.url || it.website;
      if (!u) continue;
      result.add(normalizeUrl(u));
    }
    console.log(`  Eagle 保存済みURL: ${result.size} 件（スクレイプから除外）`);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("ECONNREFUSED") || msg.includes("aborted") || msg.includes("fetch failed")) {
      console.log("  Eagle 未起動 or 応答なし。重複除外はスキップ");
    } else {
      console.log(`  Eagle API 取得エラー: ${msg}（スキップ）`);
    }
  }
  return result;
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
/**
 * Awwwards スクレイパー
 *
 * 対象: Sites of the Day（/websites/sites_of_the_day/）+ Developer Award（/websites/developer/）
 * 戦略の選定理由:
 *   - Nominees は量が膨大（2024-01以降で約9300件）かつ品質振れ幅あり、除外
 *   - SOTD = Awwwards 編集部が日毎に1件だけ選ぶ受賞作。質が均一で最上位
 *   - Developer Award = コーディング/WebGL/インタラクション評価。現ギャラリーに薄い
 *     "海外の技術尖った作品" を補完できる
 *
 * 取得方法:
 *   各カードの <li class="col-3 js-collectable"> に data-collectable-model-value という
 *   属性があり、中身が JSON（title/slug/images/tags/createdAt/id）。これをパースすれば
 *   タイトル・サムネイル・タグ・掲載日（Unix秒）が一撃で取れる。外部URLは
 *   figure-rollover__bt[href] から取得（awwwardsページではなく、実サイトのURL）。
 */
/**
 * Awwwards のセクション定義。
 * - Framer は「Made with Framer」専用棚。ここから来た結果は必ず framer シグナル確定。
 *   SOTD / Developer と重複したらこちらが先勝ち（seenSlugs）で framer シグナルを保持。
 * - 順序重要：Framer を先頭に置いて先勝ちさせる。
 */
const AWWWARDS_SECTIONS: { name: string; path: string; forceSignals?: string[] }[] = [
  { name: "Framer", path: "framer", forceSignals: ["framer"] },
  { name: "SOTD", path: "sites_of_the_day" },
  { name: "Developer", path: "developer" },
];

// 日本サイトの商用中心ソースと被りにくいよう、awwwards は最新1年に絞る。
// 他ソース (CUTOFF_DATE=2024-01) と別設定にして運用しやすく。
const AWWWARDS_CUTOFF_DATE = "2025-01";

interface AwwwardsCardPayload {
  collectableIdentifier?: string;
  collectableImage?: string;
  collectableTitle?: string;
  title?: string;
  slug?: string;
  id?: number;
  images?: { thumbnail?: string };
  tags?: string[];
  createdAt?: number; // Unix秒
  type?: string;
}

async function scrapeAwwwards(): Promise<ScrapedSite[]> {
  console.log("\n📝 Awwwards からスクレイピング開始...");
  const results: ScrapedSite[] = [];
  const seenSlugs = new Set<string>();

  for (const section of AWWWARDS_SECTIONS) {
    console.log(`  セクション: ${section.name}`);
    let page = 1;
    let stopped = false;
    const MAX_PAGES = 40; // 安全弁。2025-01 カットオフなら SOTD ~13, Developer ~12 ページで到達

    while (!stopped && page <= MAX_PAGES) {
      const url = `https://www.awwwards.com/websites/${section.path}/?page=${page}`;
      try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        const $cards = $("li.col-3.js-collectable");
        if ($cards.length === 0) {
          console.log(`    page=${page} カード0件 → セクション終了`);
          break;
        }

        let pageAdded = 0;
        let pageAllOld = true; // このページのカードが全部カットオフより古いか

        $cards.each((_, el) => {
          const raw = $(el).attr("data-collectable-model-value");
          if (!raw) return;

          let payload: AwwwardsCardPayload;
          try {
            payload = JSON.parse(raw) as AwwwardsCardPayload;
          } catch {
            return;
          }

          const title = payload.collectableTitle || payload.title || "";
          const slug = payload.slug || payload.collectableIdentifier || "";
          if (!title || !slug) return;
          if (seenSlugs.has(slug)) return; // SOTDとDeveloperで被ったら先勝ち

          // 掲載月（YYYY-MM）。createdAt は Unix 秒
          let dateStr = new Date().toISOString().slice(0, 7);
          if (payload.createdAt) {
            const d = new Date(payload.createdAt * 1000);
            if (!Number.isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 7);
          }

          // カットオフ判定：このカードが cutoff より新しいか
          if (dateStr >= AWWWARDS_CUTOFF_DATE) pageAllOld = false;
          // ページ末尾にも古いカードが混じるので、ここでは集めない判断はしない
          // （最終的に main() の CUTOFF フィルタで落とすが、awwwards 専用の早期停止に使う）

          // 実サイトURL: figure-rollover__bt が外部URL (target=_blank)
          const $outbound = $(el).find("a.figure-rollover__bt[target='_blank']").first();
          const outboundUrl = $outbound.attr("href") || "";
          // awwwards 内部ページ
          const detailUrl = `https://www.awwwards.com/sites/${slug}`;

          // サムネイル: data-srcset から 1x の URL を抽出、失敗時は images.thumbnail から組み立て
          let thumb = "";
          const $img = $(el).find("img.lazy.figure-rollover__file").first();
          const srcset = $img.attr("data-srcset") || "";
          const m1x = srcset.match(/(https?:\/\/[^\s]+)\s+1x/);
          if (m1x) thumb = m1x[1];
          if (!thumb && payload.images?.thumbnail) {
            thumb = `https://assets.awwwards.com/awards/media/cache/thumb_440_330/${payload.images.thumbnail}`;
          }
          if (!thumb) return;

          const siteUrl = outboundUrl.startsWith("http") ? outboundUrl : detailUrl;

          seenSlugs.add(slug);
          results.push({
            id: generateId(siteUrl, "awwwards"),
            title: title.slice(0, 100),
            url: siteUrl,
            thumbnailUrl: thumb,
            source: "awwwards",
            // tags には業種（Portfolio, Fashion, Agency..）と技術（GSAP, WebGL, React..）が
            // 混在。UI 側で分離せず全部 category に入れる（SANKOU!と同じ方針）
            category: payload.tags && payload.tags.length > 0 ? payload.tags : ["web design"],
            taste: [],
            date: dateStr,
            starred: false,
            // Framer 棚由来なら framer シグナルを先出し（enrich-tags が後で上書きしない）
            ...(section.forceSignals ? { signals: [...section.forceSignals] } : {}),
          });
          pageAdded++;
        });

        console.log(`    page=${page} 新規${pageAdded}件（累積 ${results.length} 件）`);

        // このページのカードが全部カットオフより古かったら以降も古いので打ち切り
        if (pageAllOld) {
          console.log(`    page=${page} 全て ${AWWWARDS_CUTOFF_DATE} 未満 → セクション終了`);
          stopped = true;
        }
      } catch (e) {
        console.error(`    page=${page} エラー:`, (e as Error).message);
      }

      page++;
      await sleep(1500); // awwwards へ 1.5s インターバル
    }
  }

  console.log(`  Awwwards 合計: ${results.length} 件`);
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

  // ONLY_SOURCE=sankou/muuuuu/webdesignclip/81web を指定すると、そのソースだけ再取得し、
  // 他のソースは既存 JSON から引き継いでマージする（時間短縮用）。
  const onlySource = (process.env.ONLY_SOURCE || "").trim().toLowerCase();
  const validSources = new Set(["", "sankou", "muuuuu", "webdesignclip", "81web", "awwwards"]);
  if (!validSources.has(onlySource)) {
    console.error(`❌ ONLY_SOURCE の値が不正です: "${onlySource}"。sankou/muuuuu/webdesignclip/81web/awwwards のいずれか、または未指定。`);
    process.exit(1);
  }
  if (onlySource) {
    console.log(`\n🎯 ONLY_SOURCE="${onlySource}" — そのソースだけ再スクレイプし、他は既存JSONから引き継ぎます`);
  }

  const allResults: ScrapedSite[] = [];

  // 先に Eagle の保存済みURLを引いておく（スクレイプ段階で除外するため）
  console.log("\n🦅 Eagle の既知URLを取得中...");
  const eagleUrls = await fetchEagleUrls();

  // 各スクレイパーを実行（順番に。並列だとサーバーに負荷かかるので）
  const shouldRun = (src: string) => !onlySource || onlySource === src;

  const sankouResults = shouldRun("sankou") ? await scrapeSankou(30) : [];
  allResults.push(...sankouResults);

  const muuuuuTarget = parseInt(process.env.MAX_MUUUUU || "1500", 10);
  const muuuuuResults = shouldRun("muuuuu") ? await scrapeMuuuuu(muuuuuTarget) : [];
  allResults.push(...muuuuuResults);

  const wdcResults = shouldRun("webdesignclip") ? await scrapeWebDesignClip(10) : [];
  allResults.push(...wdcResults);

  // 81-web.com は Nuxt3 SPA なので Playwright で取得
  const target81 = parseInt(process.env.MAX_81WEB_SITES || "2000", 10);
  const web81Results = shouldRun("81web") ? await scrape81WebPlaywright(target81) : [];
  allResults.push(...web81Results);

  // Awwwards は SOTD + Developer Award のみ、最新1年（2025-01以降）に絞る
  const awwwardsResults = shouldRun("awwwards") ? await scrapeAwwwards() : [];
  allResults.push(...awwwardsResults);

  // ONLY_SOURCE 指定時は、他のソースの既存エントリを JSON から読み込んで混ぜる。
  // 既に Eagle/2024-01 フィルタ通過済みの状態で入っているので、そのまま追加して OK。
  //
  // 並び順は重要：カラリオーバー（既存）を "先に" 並べることで、
  // 重複排除時に既存ソースが勝つ（URL が SANKOU! と Awwwards 両方にある場合、
  // 後から入ってきた新ソースが既存を奪わないようにする）
  const outputPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  let finalOrdered: ScrapedSite[];
  if (onlySource) {
    let carryover: ScrapedSite[] = [];
    try {
      const prev = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as ScrapedSite[];
      carryover = prev.filter((p) => p.source !== onlySource);
      console.log(`\n♻️  他ソースを既存JSONから引き継ぎ: ${carryover.length} 件`);
    } catch (e) {
      console.log(`\n⚠️  既存JSONの読み込み失敗（引き継ぎスキップ）: ${(e as Error).message}`);
    }
    // 既存を先、新ソースを後ろに
    finalOrdered = [...carryover, ...allResults];
  } else {
    finalOrdered = allResults;
  }

  // 重複排除（URLベースでソース横断）
  const deduplicated = deduplicateByUrl(finalOrdered);

  // ソース別カットオフを適用（古いサイトは既にユーザーが確認済み）
  // - awwwards: 最新1年（2025-01以降）
  // - その他:    2024-01以降
  const afterCutoff = deduplicated.filter((s) => {
    if (!s.date) return true;
    const cutoff = s.source === "awwwards" ? AWWWARDS_CUTOFF_DATE : CUTOFF_DATE;
    return s.date >= cutoff;
  });
  const droppedByCutoff = deduplicated.length - afterCutoff.length;

  // Eagle に既に保存済みのURLを除外
  const afterEagle = eagleUrls.size === 0
    ? afterCutoff
    : afterCutoff.filter((s) => !eagleUrls.has(normalizeUrl(s.url)));
  const droppedByEagle = afterCutoff.length - afterEagle.length;

  console.log("\n" + "=".repeat(50));
  console.log(`📊 結果サマリー:`);
  console.log(`  SANKOU!:            ${sankouResults.length} 件`);
  console.log(`  MUUUUU.ORG:         ${muuuuuResults.length} 件`);
  console.log(`  Web Design Clip:    ${wdcResults.length} 件`);
  console.log(`  81-web.com:         ${web81Results.length} 件`);
  console.log(`  Awwwards:           ${awwwardsResults.length} 件`);
  console.log(`  合計（引き継ぎ含む）: ${finalOrdered.length} 件`);
  console.log(`  重複排除後:         ${deduplicated.length} 件`);
  console.log(`  カットオフ絞込:     ${afterCutoff.length} 件 (${droppedByCutoff} 件カット、awwwards ${AWWWARDS_CUTOFF_DATE}+ / 他 ${CUTOFF_DATE}+)`);
  console.log(`  Eagle 既知除外後:   ${afterEagle.length} 件 (${droppedByEagle} 件カット)`);

  // 既存データの firstSeen を引き継ぎ、新規エントリに今の時刻を埋める
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const now = new Date().toISOString();

  const previouslyKnownUrls = new Set<string>();
  const previousFirstSeen = new Map<string, string>();
  const previousIsDead = new Map<string, boolean>();
  const previousLastCheckedAt = new Map<string, string>();
  const previousStarred = new Map<string, boolean>();
  try {
    const prev = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as ScrapedSite[];
    for (const p of prev) {
      const key = normalizeUrl(p.url);
      previouslyKnownUrls.add(key);
      if (p.firstSeen) previousFirstSeen.set(key, p.firstSeen);
      if (typeof p.isDead === "boolean") previousIsDead.set(key, p.isDead);
      if (p.lastCheckedAt) previousLastCheckedAt.set(key, p.lastCheckedAt);
      if (p.starred) previousStarred.set(key, p.starred);
    }
    console.log(`  既知URL: ${previouslyKnownUrls.size} 件（firstSeen付 ${previousFirstSeen.size} / isDead付 ${previousIsDead.size} / starred ${previousStarred.size}）`);
  } catch {
    console.log(`  既存データなし。初回実行として扱います`);
  }

  // 前回のスクレイプ時刻（マーカー無しの既存URLはこの時刻で埋めて「新着扱い」を避ける）
  let previousScrapedAt: string | null = null;
  try {
    const m = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as { scrapedAt?: string };
    previousScrapedAt = m.scrapedAt ?? null;
  } catch {}
  const grandfatheredTime =
    previousScrapedAt ?? new Date(Date.now() - 60_000).toISOString();

  let newlyDetected = 0;
  for (const site of afterEagle) {
    const key = normalizeUrl(site.url);
    const prior = previousFirstSeen.get(key);
    if (prior) {
      // 既に firstSeen が記録済み → 引き継ぎ
      site.firstSeen = prior;
    } else if (previouslyKnownUrls.has(key)) {
      // 前回スクレイプ時には存在したがマーカーなし → 後方扱い
      site.firstSeen = grandfatheredTime;
    } else {
      // 真の新規
      site.firstSeen = now;
      newlyDetected++;
    }

    // isDead / lastCheckedAt / starred はそのまま引き継ぎ（毎回のスクレイプで失いたくない）
    const prevDead = previousIsDead.get(key);
    if (typeof prevDead === "boolean") site.isDead = prevDead;
    const prevChecked = previousLastCheckedAt.get(key);
    if (prevChecked) site.lastCheckedAt = prevChecked;
    const prevStar = previousStarred.get(key);
    if (prevStar) site.starred = prevStar;
  }
  console.log(`  新規検出: ${newlyDetected} 件`);

  // JSON保存
  fs.writeFileSync(outputPath, JSON.stringify(afterEagle, null, 2), "utf-8");
  console.log(`\n✅ 保存完了: ${outputPath}`);

  // メタ情報保存（クライアントがベースライン時刻として使う）
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected }, null, 2),
    "utf-8"
  );
  console.log(`✅ メタ保存完了: ${metaPath}`);
}

main().catch(console.error);
