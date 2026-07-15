/**
 * SaaS Landing Page (saaslandingpage.com) の AI タグを「Pickup」ソースとして
 * 一括シードするスクリプト（ローカル/CIどちらでも動く・手動実行専用）。
 *
 * - /tag/ai/page/N を巡回して詳細ページの slug を収集
 * - 詳細ページから 実サイトURL（rel=nofollow の外部リンク）/ og:image / og:title /
 *   掲載月（og:image の uploads/YYYY/MM から）を抽出
 * - 既存 scraped-sites.json と Eagle 保存済み URL は除外
 * - source は "pickup"（scraper の巡回対象外。フルランでは常に引き継がれる）
 *
 * 使い方: npx tsx scripts/seed-pickup-slp-ai.ts
 */
import * as cheerio from "cheerio";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const BASE = "https://saaslandingpage.com";
// ナビ・固定ページ（記事 slug ではないもの）
const EXCLUDE_SLUGS = new Set([
  "about-us", "blog", "contact-us", "faq", "templates", "privacy-policy",
  "terms", "submit", "newsletter", "sponsor",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchEagleUrls(): Promise<Set<string>> {
  const result = new Set<string>();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("http://localhost:41595/api/item/list?limit=100000", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return result;
    const json = (await res.json()) as { data?: Array<{ url?: string; website?: string }> };
    for (const it of json.data || []) {
      const u = it.url || it.website;
      if (u) result.add(normalizeUrl(u));
    }
  } catch {
    // Eagle 不在なら除外なし
  }
  return result;
}

async function main() {
  console.log("📥 SaaS Landing Page /tag/ai/ シード開始");

  // 1) タグページ巡回で slug 収集
  const slugs = new Set<string>();
  for (let page = 1; page <= 12; page++) {
    const url = page === 1 ? `${BASE}/tag/ai/` : `${BASE}/tag/ai/page/${page}/`;
    const html = await fetchText(url);
    if (!html) {
      console.log(`  page${page}: 取得失敗/404 → 終了`);
      break;
    }
    const $ = cheerio.load(html);
    let added = 0;
    $("article a[href^='https://saaslandingpage.com/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = /^https:\/\/saaslandingpage\.com\/([a-z0-9-]+)\/$/.exec(href);
      if (!m) return;
      const slug = m[1];
      if (EXCLUDE_SLUGS.has(slug) || slug.startsWith("tag")) return;
      if (!slugs.has(slug)) {
        slugs.add(slug);
        added++;
      }
    });
    console.log(`  page${page}: +${added}（累計 ${slugs.size}）`);
    if (added === 0 && page > 1) break;
    await sleep(1000);
  }

  // 2) 詳細ページから抽出
  interface PickupSite {
    id: string; title: string; url: string; thumbnailUrl: string;
    source: "pickup"; category: string[]; taste: string[];
    date: string; starred: boolean; firstSeen?: string;
  }
  const items: PickupSite[] = [];
  let done = 0;
  for (const slug of slugs) {
    done++;
    const html = await fetchText(`${BASE}/${slug}/`);
    await sleep(700);
    if (!html) continue;
    const $ = cheerio.load(html);

    // 実サイトURL: 外部への nofollow リンク（スポンサー/姉妹サイトは除外）
    let siteUrl = "";
    $("a[target='_blank'][rel*='nofollow']").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!/^https?:\/\//.test(href)) return;
      if (/saaslandingpage\.com|saasinterface\.com|mobbin|crafted/i.test(href)) return;
      if (!siteUrl) siteUrl = href;
    });
    if (!siteUrl) continue;

    const ogTitle = $("meta[property='og:title']").attr("content") || slug;
    const title = ogTitle.replace(/\s*[–|-]\s*SaaS Landing Page.*$/i, "").trim() || slug;
    const thumb = $("meta[property='og:image']").attr("content") || "";
    if (!thumb) continue;

    let date = new Date().toISOString().slice(0, 7);
    const dm = /\/uploads\/(\d{4})\/(\d{2})\//.exec(thumb);
    if (dm) date = `${dm[1]}-${dm[2]}`;

    items.push({
      id: crypto.createHash("md5").update(`pickup:${siteUrl}`).digest("hex").slice(0, 12),
      title: title.slice(0, 100),
      url: siteUrl,
      thumbnailUrl: thumb,
      source: "pickup",
      category: ["AI", "SaaS"],
      taste: [],
      date,
      starred: false,
    });
    if (done % 10 === 0) console.log(`  詳細取得 ${done}/${slugs.size}（有効 ${items.length}）`);
  }
  console.log(`  詳細取得完了: 有効 ${items.length}/${slugs.size} 件`);

  // 3) 既存・Eagle 除外してマージ
  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as PickupSite[];
  const known = new Set(existing.map((x) => normalizeUrl(x.url)));
  const eagle = await fetchEagleUrls();
  console.log(`  Eagle 除外対象: ${eagle.size} 件`);

  const now = new Date().toISOString();
  let added = 0;
  for (const it of items) {
    const k = normalizeUrl(it.url);
    if (known.has(k) || eagle.has(k)) continue;
    known.add(k);
    existing.push({ ...it, firstSeen: now });
    added++;
  }
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf-8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected: added }, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\n✅ Pickup シード完了: +${added} 件 / 総 ${existing.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
