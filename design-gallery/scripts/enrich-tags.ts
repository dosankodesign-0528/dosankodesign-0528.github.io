/**
 * 各サイトのHTMLを取りに行って、以下のシグナル（タグ）を検出する：
 *
 *   - framer:      Framer プラットフォームで作られている
 *   - studio:      デザインスタジオ / クリエイティブスタジオの作品・自社サイト
 *   - production:  Web制作会社 / プロダクションの自社サイト
 *
 * 結果は scraped-sites.json の `signals: string[]` と `enrichedAt: ISO` に保存する。
 *
 * 使い方:
 *   npx tsx scripts/enrich-tags.ts           # 未エンリッチ or 30日経過 を処理
 *   npx tsx scripts/enrich-tags.ts --all     # 全件強制
 *   npx tsx scripts/enrich-tags.ts --limit=100  # 先頭N件だけ（検証用）
 *   npx tsx scripts/enrich-tags.ts --dry     # 書き出さず結果だけ表示
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

type Signal = "framer" | "studio" | "production";

interface Site {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  category: string[];
  taste: string[];
  agency?: string;
  color?: string;
  date: string;
  starred: boolean;
  isAgency?: boolean;
  firstSeen?: string;
  isDead?: boolean;
  lastCheckedAt?: string;
  signals?: Signal[];
  enrichedAt?: string;
}

const CONCURRENCY = 20;
const TIMEOUT_MS = 12_000;
const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30日
const MAX_HTML_BYTES = 500_000; // 500KBで十分シグナル検出可能
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const DATA_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "scraped-sites.json"
);

// ============================================================
// CLIフラグ
// ============================================================
const argv = process.argv.slice(2);
const FORCE_ALL = argv.includes("--all");
const DRY = argv.includes("--dry");
const LIMIT = (() => {
  const l = argv.find((a) => a.startsWith("--limit="));
  return l ? parseInt(l.split("=")[1], 10) : Infinity;
})();

// ============================================================
// 判定ルール
// ============================================================

/** Framer 製かどうか */
function detectFramer(html: string, finalUrl: string): boolean {
  // ドメインが *.framer.website または framer.com 系
  try {
    const host = new URL(finalUrl).hostname.toLowerCase();
    if (host.endsWith(".framer.website") || host.endsWith(".framer.app")) {
      return true;
    }
  } catch {
    // ignore
  }
  // <meta name="generator" content="Framer">
  if (/<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*Framer/i.test(html)) {
    return true;
  }
  // 静的アセット CDN
  if (/https?:\/\/[^"'\s]*\.?framer\.com\//i.test(html)) {
    return true;
  }
  if (/https?:\/\/framerusercontent\.com\//i.test(html)) {
    return true;
  }
  // data-framer-hydrate-v2 など Framer ランタイム属性
  if (/data-framer-(hydrate|name|component)/i.test(html)) {
    return true;
  }
  return false;
}

/**
 * スタジオ判定：サイトのtitle / meta description / h1 / ドメイン名 に
 * 「スタジオ系」のキーワードが含まれている。
 * Web制作会社よりも少人数・ブティック寄りのニュアンス。
 */
function detectStudio($: cheerio.CheerioAPI, finalUrl: string): boolean {
  const title = ($("title").first().text() || "").toLowerCase();
  const desc = (
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    ""
  ).toLowerCase();
  const h1 = ($("h1").first().text() || "").toLowerCase();
  const ogSiteName = (
    $('meta[property="og:site_name"]').attr("content") || ""
  ).toLowerCase();

  let host = "";
  try {
    host = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    // ignore
  }

  const blob = `${title} | ${desc} | ${h1} | ${ogSiteName} | ${host}`;

  // ドメインや屋号にstudio/labが入っている
  if (/\bstudio\b/.test(blob)) return true;
  if (/\blabs?\b/.test(blob)) return true;
  if (/スタジオ/.test(blob)) return true;
  if (/creative\s+(studio|lab|agency)/i.test(blob)) return true;
  if (/design\s+studio/i.test(blob)) return true;
  if (/クリエイティブ(スタジオ|ラボ)/.test(blob)) return true;
  return false;
}

/**
 * プロダクション判定：Web制作会社・プロダクションの自社サイトっぽい。
 * 「株式会社」＋「Web/デザイン/制作」みたいな組み合わせ、
 * もしくは明示的に "Web Production" / "制作会社" を謳っている。
 */
function detectProduction(
  $: cheerio.CheerioAPI,
  finalUrl: string
): boolean {
  const title = ($("title").first().text() || "").toLowerCase();
  const desc = (
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    ""
  ).toLowerCase();
  const h1 = ($("h1").first().text() || "").toLowerCase();

  const blob = `${title} | ${desc} | ${h1}`;

  // 日本語: 制作会社 / Web制作 / ウェブ制作
  if (/制作会社/.test(blob)) return true;
  if (/web\s*制作/i.test(blob)) return true;
  if (/ウェブ\s*制作/.test(blob)) return true;
  if (/web\s*プロダクション/i.test(blob)) return true;
  if (/プロダクション/.test(blob) && /(web|ウェブ|制作|design)/i.test(blob))
    return true;

  // 英語: Web Production / Web Agency / Web Design Agency / Web Development Agency
  if (/web\s+(production|agency|development\s+agency|design\s+agency)/i.test(blob))
    return true;
  if (/\bdigital\s+agency\b/i.test(blob)) return true;
  if (/\bproduction\s+(house|company)\b/i.test(blob)) return true;

  // 株式会社 + Web/デザイン/制作
  if (/株式会社/.test(blob) && /(web|ウェブ|デザイン|制作)/i.test(blob))
    return true;

  return false;
}

// ============================================================
// フェッチ
// ============================================================

async function fetchWithLimit(url: string): Promise<{ html: string; finalUrl: string } | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    if (!res.ok || !res.body) return null;

    // ボディを MAX_HTML_BYTES まで読む
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    try {
      await reader.cancel();
    } catch {}
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c.subarray(0, Math.min(c.length, total - offset)), offset);
      offset += c.length;
      if (offset >= total) break;
    }
    // 文字コードは最悪UTF-8決め打ち。Framer系もJP系もUTF-8多数なので許容
    const html = new TextDecoder("utf-8", { fatal: false }).decode(merged);
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// ワーカープール
// ============================================================

async function runPool<T, R>(
  items: T[],
  worker: (item: T, idx: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ============================================================
// メイン
// ============================================================

function shouldProcess(site: Site): boolean {
  if (site.isDead) return false;
  if (FORCE_ALL) return true;
  if (!site.enrichedAt) return true;
  const last = Date.parse(site.enrichedAt);
  if (isNaN(last)) return true;
  return Date.now() - last > STALE_THRESHOLD_MS;
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const sites: Site[] = JSON.parse(raw);
  console.log(`📦 読み込み: ${sites.length} 件`);

  const targets = sites.filter(shouldProcess).slice(0, LIMIT);
  console.log(
    `🎯 対象: ${targets.length} 件 (FORCE_ALL=${FORCE_ALL}, LIMIT=${
      LIMIT === Infinity ? "∞" : LIMIT
    })`
  );
  if (targets.length === 0) {
    console.log("処理対象なし。終了。");
    return;
  }

  let done = 0;
  let okCount = 0;
  const tally: Record<Signal, number> = {
    framer: 0,
    studio: 0,
    production: 0,
  };

  await runPool(
    targets,
    async (site) => {
      const fetched = await fetchWithLimit(site.url);
      done++;
      if (done % 50 === 0 || done === targets.length) {
        console.log(`  ${done}/${targets.length} …`);
      }
      if (!fetched) {
        // 取得失敗は signals を空で上書きしない（既存値維持）
        return;
      }
      okCount++;
      const { html, finalUrl } = fetched;
      const $ = cheerio.load(html);

      const signals: Signal[] = [];
      if (detectFramer(html, finalUrl)) signals.push("framer");
      if (detectStudio($, finalUrl)) signals.push("studio");
      if (detectProduction($, finalUrl)) signals.push("production");

      for (const s of signals) tally[s]++;

      // 元配列を直接書き換える
      site.signals = signals;
      site.enrichedAt = new Date().toISOString();
    },
    CONCURRENCY
  );

  console.log("\n=== 結果 ===");
  console.log(`フェッチ成功: ${okCount}/${targets.length}`);
  console.log(`framer     : ${tally.framer}`);
  console.log(`studio     : ${tally.studio}`);
  console.log(`production : ${tally.production}`);

  if (DRY) {
    console.log("\n(--dry) 保存しません。");
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(sites, null, 2));
  console.log(`\n💾 保存: ${DATA_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
