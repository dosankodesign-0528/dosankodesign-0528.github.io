/**
 * 「anyflow テイスト」一括シードスクリプト（ローカル実行専用）
 *
 * ヒデさんの Eagle「anyflow」タグのテイスト:
 *   「抽象3D×発光グラデで"未来"を宣言する、テック系ブランドサイト」
 *   - 抽象ビッグメッセージ（Scan your Future. / CREATING THE FUTURE 系コピー＋ビッグタイポ）
 *   - アブストラクト3D/立体グラフィック（流体・パーティクル・幾何学 / WebGL・Three.js）
 *   - オーロラ/ホログラフィックグラデーション（ダーク背景＋グロー発光）
 *   - テック・フューチャリスティック文脈（テック企業/採用/ブランド/研究機関）
 *
 * 供給源:
 *   1) Awwwards /websites/3d/ と /websites/gradient/（海外中心・実日付あり）
 *      ⚠️ Cloudflare が CI を弾くため自宅 Mac などローカルでしか動かない
 *   2) S5-Style API を深掘りし、styles に 3D/パララックス/スクロールエフェクト を
 *      含むものだけ抽出（日本のスタイリッシュ枠・日付は今月扱い）
 *
 * 除外: 既存 scraped-sites.json の URL / Eagle 保存済み URL（正規化して比較）
 * 追加分は firstSeen=now で新着扱いになり、未確認ビューの先頭に流れる。
 *
 * 使い方:
 *   npx tsx scripts/seed-anyflow-taste.ts            # 200件シード
 *   SEED_TARGET=100 npx tsx scripts/seed-anyflow-taste.ts
 *   SEED_SHELVES="3d,gradient,webgl,animation" SEED_PAGES=16 npx tsx scripts/seed-anyflow-taste.ts
 *     ↑ 在庫が尽きたら棚を広げ・深くする（2回目以降の補充用。既出URLは自動除外）
 */
import * as cheerio from "cheerio";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";
import { tagHousing } from "./housing";

const SEED_TARGET = parseInt(process.env.SEED_TARGET || "200", 10);
// 海外(awwwards):日本(s5style) の目標比率。SEED_AWWWARDS_SHARE=1 で Awwwards のみ。
const AWWWARDS_SHARE = Math.min(1, Math.max(0, parseFloat(process.env.SEED_AWWWARDS_SHARE || "0.7")));
const AWWWARDS_TARGET = Math.round(SEED_TARGET * AWWWARDS_SHARE);
// 巡回する Awwwards の棚と深さ。補充のたびに在庫が減るので、2回目以降は
// SEED_SHELVES で隣接棚（webgl/animation/three-js/dark）へ広げ、SEED_PAGES で深くする。
const SEED_SHELVES = (process.env.SEED_SHELVES || "3d,gradient")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SEED_PAGES = parseInt(process.env.SEED_PAGES || "8", 10);
// SEED_FILTER: 正規表現。指定すると Awwwards カードの title/url/tags のどれかに
// マッチするものだけ採用（例: AI系だけ欲しい時に "\\bAI\\b|artificial|GPT|agent"）。
const SEED_FILTER = process.env.SEED_FILTER ? new RegExp(process.env.SEED_FILTER, "i") : null;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
// 採用する掲載月の下限。既定は他ソースと同じ 2024-01。
// SEED_CUTOFF=2026-01 のように指定すると「最近のものだけ総ざらい」ができる。
const CUTOFF = process.env.SEED_CUTOFF || "2024-01";

interface SeedSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "awwwards" | "s5style";
  category: string[];
  taste: string[];
  date: string;
  starred: boolean;
  firstSeen?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/json,*/*" },
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function generateId(url: string, source: string): string {
  return crypto.createHash("md5").update(`${source}:${url}`).digest("hex").slice(0, 12);
}

// ============================================================
// 1) Awwwards の棚（3d / gradient）— scraper.ts の scrapeAwwwards と同じカード構造
// ============================================================
interface AwwwardsCardPayload {
  collectableTitle?: string;
  title?: string;
  slug?: string;
  collectableIdentifier?: string;
  images?: { thumbnail?: string };
  tags?: string[];
  createdAt?: number;
}

async function scrapeAwwwardsShelf(
  shelf: string,
  maxPages: number,
  seenSlugs: Set<string>
): Promise<SeedSite[]> {
  const results: SeedSite[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://www.awwwards.com/websites/${shelf}/?page=${page}`;
    let html: string;
    try {
      html = await fetchText(url);
    } catch (e) {
      console.log(`    ${shelf} page=${page} エラー: ${(e as Error).message}（打ち切り）`);
      break;
    }
    const $ = cheerio.load(html);
    const $cards = $("li.col-3.js-collectable");
    if ($cards.length === 0) {
      console.log(`    ${shelf} page=${page} カード0件 → 終了`);
      break;
    }
    let added = 0;
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
      if (!title || !slug || seenSlugs.has(slug)) return;

      let dateStr = new Date().toISOString().slice(0, 7);
      if (payload.createdAt) {
        const d = new Date(payload.createdAt * 1000);
        if (!Number.isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 7);
      }
      if (dateStr < CUTOFF) return;

      const outboundUrl =
        $(el).find("a.figure-rollover__bt[target='_blank']").first().attr("href") || "";

      // キーワード絞り込み（title / 外部URL / tags のどれかにマッチしたものだけ）
      if (SEED_FILTER) {
        const hay = `${title} ${outboundUrl} ${(payload.tags || []).join(" ")}`;
        if (!SEED_FILTER.test(hay)) return;
      }
      let thumb = "";
      const srcset = $(el).find("img.lazy.figure-rollover__file").first().attr("data-srcset") || "";
      const m1x = srcset.match(/(https?:\/\/[^\s]+)\s+1x/);
      if (m1x) thumb = m1x[1];
      if (!thumb && payload.images?.thumbnail) {
        thumb = `https://assets.awwwards.com/awards/media/cache/thumb_440_330/${payload.images.thumbnail}`;
      }
      if (!thumb) return;
      const siteUrl = outboundUrl.startsWith("http")
        ? outboundUrl
        : `https://www.awwwards.com/sites/${slug}`;

      seenSlugs.add(slug);
      results.push({
        id: generateId(siteUrl, "awwwards"),
        title: title.slice(0, 100),
        url: siteUrl,
        thumbnailUrl: thumb,
        source: "awwwards",
        category: payload.tags && payload.tags.length > 0 ? payload.tags : [shelf],
        taste: [],
        date: dateStr,
        starred: false,
      });
      added++;
    });
    console.log(`    ${shelf} page=${page}: +${added} 件`);
    await sleep(1500);
  }
  return results;
}

// ============================================================
// 2) S5-Style 深掘り（3D/パララックス/スクロールエフェクトのスタイルタグで絞る）
// ============================================================
interface S5Tag {
  label: string;
}
interface S5Item {
  title: string;
  site_url: string;
  images: { l?: string; m?: string; s?: string };
  categories: S5Tag[];
  styles: S5Tag[];
  types: S5Tag[];
}

const S5_STYLE_MATCH = /3D|パララックス|スクロールエフェクト/;

async function scrapeS5Stylish(maxOffset: number): Promise<SeedSite[]> {
  const results: SeedSite[] = [];
  const seen = new Set<string>();
  const todayMonth = new Date().toISOString().slice(0, 7);
  for (let offset = 0; offset < maxOffset; offset += 100) {
    let json: { items: S5Item[]; count: number };
    try {
      const txt = await fetchText(`https://api.s5-style.com/posts/?offset=${offset}&limit=100`);
      json = JSON.parse(txt);
    } catch (e) {
      console.log(`    s5 offset=${offset} エラー: ${(e as Error).message}（打ち切り）`);
      break;
    }
    if (!json.items || json.items.length === 0) break;
    let added = 0;
    for (const it of json.items) {
      if (!it.site_url || !it.title) continue;
      const styleLabels = (it.styles || []).map((s) => s.label).join(" ");
      if (!S5_STYLE_MATCH.test(styleLabels)) continue;
      const thumb = it.images?.l || it.images?.m || it.images?.s;
      if (!thumb) continue;
      if (seen.has(it.site_url)) continue;
      seen.add(it.site_url);
      results.push({
        id: generateId(it.site_url, "s5style"),
        title: it.title.slice(0, 100),
        url: it.site_url,
        thumbnailUrl: thumb,
        source: "s5style",
        category: [
          ...(it.types || []).map((t) => t.label),
          ...(it.categories || []).map((c) => c.label),
        ].slice(0, 5),
        taste: (it.styles || []).map((s) => s.label).slice(0, 5),
        date: todayMonth,
        starred: false,
      });
      added++;
    }
    if (added > 0) console.log(`    s5 offset=${offset}: +${added} 件（累計 ${results.length}）`);
    await sleep(800);
  }
  return results;
}

// ============================================================
// Eagle 保存済み URL（起動していなければ空 = 除外なし）
// ============================================================
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
    // Eagle 不在なら除外なしで続行
  }
  return result;
}

async function main() {
  console.log(`🎨 anyflow テイスト シード開始（目標 ${SEED_TARGET} 件）`);

  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as SeedSite[];
  const knownUrls = new Set(existing.map((x) => normalizeUrl(x.url)));

  console.log("\n🦅 Eagle 保存済みURLを取得中...");
  const eagleUrls = await fetchEagleUrls();
  console.log(`  Eagle: ${eagleUrls.size} 件を除外対象に`);

  const isNew = (u: string) => {
    const k = normalizeUrl(u);
    return !knownUrls.has(k) && !eagleUrls.has(k);
  };

  // 1) Awwwards 3d + gradient（新規だけ数えて目標の7割まで）
  console.log(`\n📝 Awwwards 棚: ${SEED_SHELVES.join(" / ")}（各${SEED_PAGES}ページまで）...`);
  const seenSlugs = new Set<string>();
  const awwwardsAll: SeedSite[] = [];
  for (const shelf of SEED_SHELVES) {
    const got = await scrapeAwwwardsShelf(shelf, SEED_PAGES, seenSlugs);
    awwwardsAll.push(...got);
    const newCount = awwwardsAll.filter((s) => isNew(s.url)).length;
    console.log(`  ${shelf} 累計: ${awwwardsAll.length} 件（うち新規 ${newCount}）`);
    if (newCount >= AWWWARDS_TARGET) break;
  }
  // 新しい順に並べて目標数まで
  const awwwardsNew = awwwardsAll
    .filter((s) => isNew(s.url))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, AWWWARDS_TARGET);

  // 2) S5-Style（残り枠）。SEED_AWWWARDS_SHARE=1 のときは Awwwards が目標に
  // 届かなくても S5 で埋めない（テーマ違いのサイトが混ざるのを防ぐ）。
  const s5Quota = AWWWARDS_SHARE >= 1 ? 0 : SEED_TARGET - awwwardsNew.length;
  console.log(`\n📝 S5-Style 深掘り（3D/パララックス/スクロールエフェクト、枠 ${s5Quota} 件）...`);
  const s5All = await scrapeS5Stylish(4000);
  const s5New = s5All.filter((s) => isNew(s.url)).slice(0, s5Quota);

  // 3) マージ（既存優先・URL重複スキップ）
  const now = new Date().toISOString();
  const toAdd = [...awwwardsNew, ...s5New];
  let added = 0;
  for (const s of toAdd) {
    const k = normalizeUrl(s.url);
    if (knownUrls.has(k)) continue;
    knownUrls.add(k);
    existing.push({ ...s, firstSeen: now });
    added++;
  }
  const taggedHousing = tagHousing(existing);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf-8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected: added }, null, 2) + "\n",
    "utf-8"
  );

  console.log(`\n✅ シード完了: +${added} 件（awwwards ${awwwardsNew.length} / s5style ${s5New.length}）`);
  console.log(`  住宅タグ再付与: ${taggedHousing} 件 / 総 ${existing.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
