/**
 * FWA (thefwa.com) の受賞作を「Pickup」ソースとしてシードするスクリプト（手動実行）。
 *
 * FWA は Awwwards と並ぶ海外二大 Web アワードの一つ（FOTD = FWA of the Day）。
 * 公開 JSON API があり、認証なしで全ケースを新しい順に取れる:
 *   GET https://thefwa.com/api/cases?page=N
 *   → { cases: [{ title, slug, url(実サイト), createdDate, thumbnail{size:{span:path}},
 *        categories[{name}], awards[{type, awardedDate}], ... }], total, totalCases }
 *
 * - SEED_CUTOFF（既定 2025-01）より新しいものだけ採用
 * - 既存 scraped-sites.json / Eagle 保存済みは除外
 * - source は "pickup"（scraper 巡回対象外。フルランでも常時引き継がれる）
 *
 * 使い方:
 *   npx tsx scripts/seed-pickup-fwa.ts
 *   SEED_TARGET=300 SEED_CUTOFF=2024-01 npx tsx scripts/seed-pickup-fwa.ts
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

const SEED_TARGET = parseInt(process.env.SEED_TARGET || "200", 10);
const CUTOFF = process.env.SEED_CUTOFF || "2025-01";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

interface FwaCase {
  title?: string;
  slug?: string;
  url?: string;
  createdDate?: string;
  thumbnail?: Record<string, Record<string, string>>;
  categories?: Array<{ name?: string }>;
  awards?: Array<{ type?: string; awardedDate?: string }>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** thumbnail のサイズ辞書から一番大きい画像パスを選ぶ */
function pickThumb(t?: Record<string, Record<string, string>>): string {
  if (!t) return "";
  let best = "";
  let bestWidth = 0;
  for (const [widthKey, spans] of Object.entries(t)) {
    const w = parseInt(widthKey, 10) || 0;
    for (const p of Object.values(spans || {})) {
      if (w >= bestWidth && typeof p === "string" && p.startsWith("/")) {
        bestWidth = w;
        best = p;
      }
    }
  }
  return best ? `https://thefwa.com${best}` : "";
}

async function main() {
  console.log(`🏆 FWA シード開始（目標 ${SEED_TARGET} 件 / ${CUTOFF} 以降）`);

  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const known = new Set(existing.map((x: { url: string }) => normalizeUrl(x.url)));
  const eagle = await fetchEagleUrls();
  console.log(`Eagle 除外対象: ${eagle.size} 件`);

  const now = new Date().toISOString();
  const out: unknown[] = [];
  let stop = false;

  for (let page = 1; page <= 60 && !stop && out.length < SEED_TARGET; page++) {
    let json: { cases?: FwaCase[] };
    try {
      const res = await fetch(`https://thefwa.com/api/cases?page=${page}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!res.ok) break;
      json = (await res.json()) as { cases?: FwaCase[] };
    } catch {
      break;
    }
    const cases = json.cases || [];
    if (cases.length === 0) break;

    let added = 0;
    for (const c of cases) {
      if (out.length >= SEED_TARGET) break;
      const date = (c.awards?.[0]?.awardedDate || c.createdDate || "").slice(0, 7);
      if (date && date < CUTOFF) {
        // API は新しい順なので、カットオフより古くなったら以降のページも古い
        stop = true;
        break;
      }
      if (!c.title || !c.url || !/^https?:\/\//.test(c.url)) continue;
      const thumb = pickThumb(c.thumbnail);
      if (!thumb) continue;
      const k = normalizeUrl(c.url);
      if (known.has(k) || eagle.has(k)) continue;
      known.add(k);
      const awardType = c.awards?.[0]?.type || "FWA";
      out.push({
        id: crypto.createHash("md5").update(`pickup:${c.url}`).digest("hex").slice(0, 12),
        title: c.title.slice(0, 100),
        url: c.url,
        thumbnailUrl: thumb,
        source: "pickup",
        category: ["FWA", awardType, ...(c.categories || []).map((x) => x.name || "").filter(Boolean)].slice(0, 5),
        taste: [],
        date: date || now.slice(0, 7),
        starred: false,
        firstSeen: now,
      });
      added++;
    }
    console.log(`  page ${page}: +${added}（累計 ${out.length}）`);
    await sleep(800);
  }

  existing.push(...out);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf-8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected: out.length }, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\n✅ FWA シード完了: +${out.length} 件 / 総 ${existing.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
