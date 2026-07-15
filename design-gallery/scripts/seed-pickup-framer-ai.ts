/**
 * Framer製インタラクションサイト＋日本のAI系サービスを「Pickup」ソースとして
 * シードするスクリプト（手動実行専用）。
 *
 * ヒデさん要望（2026-07-15）:
 *   - Framer 使用でパララックス/スクロールアニメ等インタラクション多めを200件
 *   - AI系デジタルサービスなら尚良し・2025〜2026年
 *   - 日本のAI系デジタルサービスのスタイリッシュ系も混ぜる
 *
 * 供給源:
 *   A) Framer 公式ギャラリー https://www.framer.com/community/gallery/
 *      - 一覧はクライアントレンダリングなので Playwright でスクロールして slug 収集
 *      - 詳細ページ（静的HTML）から 実サイトURL / タイトル / プレビュー画像を抽出
 *      - Framer製確定なので signals:["framer"] を付与（FilterModal の Framer 絞込に乗る）
 *      - AI っぽい slug/タイトルを優先採用
 *   B) SANKOU! の検索 https://sankoudesign.com/?s=AI
 *      - 既存 parseSankouCards と同じカード構造。実日付あり → 2025-01 以降のみ
 *      - タイトルが AI 文脈のものだけ（検索のあいまいヒットを除外）
 *
 * 使い方:
 *   npx tsx scripts/seed-pickup-framer-ai.ts
 *   SEED_TARGET=200 FRAMER_QUOTA=160 npx tsx scripts/seed-pickup-framer-ai.ts
 */
import { chromium } from "playwright";
import * as cheerio from "cheerio";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

const SEED_TARGET = parseInt(process.env.SEED_TARGET || "200", 10);
const FRAMER_QUOTA = parseInt(process.env.FRAMER_QUOTA || "160", 10);
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const AI_RE = /\bai\b|artificial|\bgpt|\bagent|llm|copilot|machine.?learning|neural|generative|ＡＩ|人工知能|生成AI/i;
const JP_CUTOFF = "2025-01";

interface PickupSite {
  id: string; title: string; url: string; thumbnailUrl: string;
  source: "pickup"; category: string[]; taste: string[];
  date: string; starred: boolean; firstSeen?: string; signals?: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    const res = await fetch("http://localhost:41595/api/item/list?limit=100000");
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

function pickupId(siteUrl: string): string {
  return crypto.createHash("md5").update(`pickup:${siteUrl}`).digest("hex").slice(0, 12);
}

// ============================================================
// A) Framer 公式ギャラリー
// ============================================================
async function collectFramerSlugs(scrolls: number): Promise<string[]> {
  console.log("\n🖼  Framer ギャラリーを Playwright で巡回...");
  const b = await chromium.launch();
  const p = await b.newPage({ userAgent: UA });
  await p.goto("https://www.framer.com/community/gallery/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (let i = 0; i < scrolls; i++) {
    await p.mouse.wheel(0, 4000);
    await p.waitForTimeout(1200);
    const hrefs: string[] = await p.evaluate(() =>
      Array.from(document.querySelectorAll("a[href^='/community/gallery/']"))
        .map((a) => a.getAttribute("href") || "")
    );
    for (const h of hrefs) {
      const m = /^\/community\/gallery\/([a-z0-9-]+)\/?$/.exec(h);
      if (m && !seen.has(m[1])) {
        seen.add(m[1]);
        ordered.push(m[1]);
      }
    }
    if ((i + 1) % 5 === 0) console.log(`  scroll ${i + 1}/${scrolls}: slug ${ordered.length} 件`);
  }
  await b.close();
  console.log(`  slug 収集完了: ${ordered.length} 件`);
  return ordered;
}

async function scrapeFramerDetail(slug: string): Promise<PickupSite | null> {
  const html = await fetchText(`https://www.framer.com/community/gallery/${slug}/`);
  if (!html) return null;
  const $ = cheerio.load(html);

  const ogTitle = $("meta[property='og:title']").attr("content") || slug;
  const title = ogTitle.replace(/^Framer Gallery:\s*/i, "").trim() || slug;

  // 実サイトURL: "Visit"ボタン（button-module クラスの外部リンク）
  let siteUrl = "";
  $("a[href^='http']").each((_, el) => {
    if (siteUrl) return;
    const href = $(el).attr("href") || "";
    const cls = $(el).attr("class") || "";
    if (!/button-module/.test(cls)) return;
    if (/framer\.com|framer\.link/i.test(href)) return;
    siteUrl = href;
  });
  if (!siteUrl) return null;

  // プレビュー画像: embed-preview の srcSet（/creators-assets/_next/image/?url=<enc>）
  let thumb = "";
  const srcset = $("img[class*='embed-preview']").first().attr("srcset") ||
    $("img[class*='embed-preview']").first().attr("srcSet") || "";
  const m = /url=([^&\s]+)/.exec(srcset);
  if (m) {
    try { thumb = decodeURIComponent(m[1]); } catch { /* noop */ }
  }
  if (!thumb) return null;

  return {
    id: pickupId(siteUrl),
    title: title.slice(0, 100),
    url: siteUrl,
    thumbnailUrl: thumb,
    source: "pickup",
    category: ["Framer", "Interaction"],
    taste: [],
    date: new Date().toISOString().slice(0, 7), // 一覧に日付が無いため今月扱い
    starred: false,
    signals: ["framer"],
  };
}

// ============================================================
// B) SANKOU! AI検索（日本のAI系サービス）
// ============================================================
async function scrapeSankouAi(maxPages: number): Promise<PickupSite[]> {
  console.log("\n🇯🇵 SANKOU! AI検索を巡回...");
  const out: PickupSite[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= maxPages; page++) {
    const url =
      page === 1
        ? "https://sankoudesign.com/?s=AI"
        : `https://sankoudesign.com/page/${page}/?s=AI`;
    const html = await fetchText(url);
    if (!html) break;
    const $ = cheerio.load(html);
    let added = 0;
    $("article li").each((_, el) => {
      const $el = $(el);
      const $img = $el.find("img.wp-post-image").first();
      const img = $img.attr("data-src") || $img.attr("src") || "";
      const title = ($img.attr("alt") || "").trim();
      const siteUrl = $el.find("figure a[target='_blank']").attr("href") || "";
      if (!img || !title || !siteUrl || img.startsWith("data:")) return;
      // 検索のあいまいヒットを除外（タイトル/URLがAI文脈のものだけ）
      if (!AI_RE.test(`${title} ${siteUrl}`)) return;

      let date = new Date().toISOString().slice(0, 7);
      const rawDate = $el.find('p[class^="list_time"]').first().text().trim();
      const dm = rawDate.match(/^(\d{4})[/-](\d{2})/);
      if (dm) date = `${dm[1]}-${dm[2]}`;
      if (date < JP_CUTOFF) return; // 2025年以降のみ

      if (seen.has(siteUrl)) return;
      seen.add(siteUrl);
      out.push({
        id: pickupId(siteUrl),
        title: title.slice(0, 100),
        url: siteUrl,
        thumbnailUrl: img.startsWith("http") ? img : `https://sankoudesign.com${img}`,
        source: "pickup",
        category: ["AI", "日本"],
        taste: [],
        date,
        starred: false,
      });
      added++;
    });
    console.log(`  page${page}: +${added}（累計 ${out.length}）`);
    if (added === 0 && page > 1) break;
    await sleep(1500);
  }
  return out;
}

// ============================================================
async function main() {
  console.log(`🎯 Framer×インタラクション + 日本AI シード開始（目標 ${SEED_TARGET} 件）`);

  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as PickupSite[];
  const known = new Set(existing.map((x) => normalizeUrl(x.url)));
  const eagle = await fetchEagleUrls();
  console.log(`Eagle 除外対象: ${eagle.size} 件`);
  const isNew = (u: string) => {
    const k = normalizeUrl(u);
    return !known.has(k) && !eagle.has(k);
  };

  // B) 日本AI（先に確保。実日付があり優先度が高い）
  const jpQuota = SEED_TARGET - FRAMER_QUOTA;
  const sankouAll = await scrapeSankouAi(6);
  const sankouNew = sankouAll.filter((s) => isNew(s.url)).slice(0, jpQuota);
  console.log(`  日本AI 採用: ${sankouNew.length} 件（枠 ${jpQuota}）`);

  // A) Framer（AI slug 優先＋掲載順）
  const slugs = await collectFramerSlugs(20);
  const queue = [
    ...slugs.filter((s) => AI_RE.test(s)),
    ...slugs.filter((s) => !AI_RE.test(s)),
  ];
  const framerQuota = SEED_TARGET - sankouNew.length;
  const framerNew: PickupSite[] = [];
  let checked = 0;
  for (const slug of queue) {
    if (framerNew.length >= framerQuota) break;
    checked++;
    const item = await scrapeFramerDetail(slug);
    await sleep(600);
    if (!item) continue;
    if (!isNew(item.url)) continue;
    known.add(normalizeUrl(item.url)); // バッチ内重複も防ぐ
    framerNew.push(item);
    if (framerNew.length % 20 === 0)
      console.log(`  Framer 確保 ${framerNew.length}/${framerQuota}（走査 ${checked}/${queue.length}）`);
  }
  console.log(`  Framer 採用: ${framerNew.length} 件（走査 ${checked} slug）`);

  // マージ
  const now = new Date().toISOString();
  const toAdd = [...sankouNew, ...framerNew];
  for (const s of toAdd) s.firstSeen = now;
  existing.push(...toAdd);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf-8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected: toAdd.length }, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\n✅ シード完了: +${toAdd.length} 件（Framer ${framerNew.length} / 日本AI ${sankouNew.length}）/ 総 ${existing.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
