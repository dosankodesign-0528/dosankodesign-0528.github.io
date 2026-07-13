/**
 * One Page Love 専用スクレイパー
 *
 * https://onepagelove.com/ は海外の名作 1ページ / ランディングページ集。
 * Framer 製・ロングスクロール・パララックス系が主役で、Awwwards が
 * Cloudflare で CI から取れないのに対し、こちらは WordPress の RSS が
 * そのまま取れる（CI でも回る）。
 *
 * 取得フロー:
 *   1) RSS (/feed, /feed?paged=N) から新着エントリを取る
 *      → title / 詳細ページlink / pubDate / category / サムネ(content:encoded の img)
 *   2) 実際の紹介サイトURL(外部リンク)は詳細ページ側にあるので、詳細ページを
 *      叩いて `title="Visit ... Website"` の href を抜く（?ref= は落とす）
 *
 * 使い方:
 *   npx tsx scripts/scrape-onepagelove.ts
 *   ONEPAGELOVE_PAGES=5 npx tsx scripts/scrape-onepagelove.ts
 */
import * as crypto from "crypto";

export interface ScrapedOnePageLoveSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "onepagelove";
  category: string[];
  taste: string[];
  date: string; // YYYY-MM
  starred: boolean;
}

const FEED_BASE = "https://onepagelove.com/feed";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function generateId(siteUrl: string): string {
  return crypto.createHash("md5").update(`onepagelove:${siteUrl}`).digest("hex").slice(0, 12);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string, timeoutMs = 15000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xml,*/*" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface RssItem {
  title: string;
  link: string; // 詳細ページ
  date: string; // YYYY-MM
  thumbnailUrl: string;
  categories: string[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** RSS の生 XML から item を抜く */
function parseFeed(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.split(/<item>/).slice(1);
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/)[0];

    const titleRaw =
      /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(block)?.[1]?.trim() || "";
    // "Website Inspiration: X" / "Website Design: X" などの接頭辞を落とす
    const title = decodeEntities(titleRaw).replace(/^Website (Inspiration|Design|Showcase):\s*/i, "").trim();

    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1]?.trim() || "";

    const pub = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim() || "";
    let date = new Date().toISOString().slice(0, 7);
    const d = pub ? new Date(pub) : null;
    if (d && !isNaN(d.getTime())) date = d.toISOString().slice(0, 7);

    const categories: string[] = [];
    const catRe = /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g;
    let m: RegExpExecArray | null;
    while ((m = catRe.exec(block))) {
      const c = decodeEntities(m[1].trim());
      if (c) categories.push(c);
    }

    // サムネ: content:encoded 内の最初の <img src>
    const content = /<content:encoded>([\s\S]*?)<\/content:encoded>/.exec(block)?.[1] || "";
    const thumbnailUrl = /<img[^>]+src="([^"]+)"/i.exec(content)?.[1]?.trim() || "";

    if (title && link) items.push({ title, link, date, thumbnailUrl, categories });
  }
  return items;
}

/** 詳細ページから実際の紹介サイトURL(外部リンク)を抜く。取れなければ null。 */
async function resolveExternalUrl(detailUrl: string): Promise<string | null> {
  const html = await fetchText(detailUrl);
  if (!html) return null;
  // <a href="https://real-site.com?ref=onepagelove" ... title="Visit ... Website">
  const m =
    /href="(https?:\/\/[^"]+)"[^>]*title="Visit[^"]*Website"/i.exec(html) ||
    /<a[^>]+title="Visit[^"]*Website"[^>]*href="(https?:\/\/[^"]+)"/i.exec(html);
  if (!m) return null;
  let url = m[1];
  // ?ref=onepagelove / &ref=onepagelove を除去
  url = url.replace(/([?&])ref=onepagelove(&|$)/i, (_, p1, p2) => (p2 === "&" ? p1 : "")).replace(/[?&]$/, "");
  return url;
}

/**
 * One Page Love を新着順に取得。
 * @param pages RSS を何ページ遡るか（1ページ=最新10件前後）
 */
export async function scrapeOnePageLove(pages = 3): Promise<ScrapedOnePageLoveSite[]> {
  console.log("\n💛 One Page Love からスクレイピング開始...");
  const rssItems: RssItem[] = [];
  const seenLinks = new Set<string>();

  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? FEED_BASE : `${FEED_BASE}?paged=${page}`;
    const xml = await fetchText(url);
    if (!xml) {
      console.log(`  RSS page${page}: 取得失敗（打ち切り）`);
      break;
    }
    const got = parseFeed(xml).filter((it) => !seenLinks.has(it.link));
    if (got.length === 0) {
      console.log(`  RSS page${page}: 新規0件（打ち切り）`);
      break;
    }
    got.forEach((it) => seenLinks.add(it.link));
    rssItems.push(...got);
    console.log(`  RSS page${page}: +${got.length} 件（累計 ${rssItems.length}）`);
    await sleep(800);
  }

  // 詳細ページで外部URLを補完（5並列）
  const results: ScrapedOnePageLoveSite[] = [];
  const CONCURRENCY = 5;
  let cursor = 0;
  let resolved = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < rssItems.length) {
      const it = rssItems[cursor++];
      const ext = await resolveExternalUrl(it.link);
      const siteUrl = ext || it.link; // 取れなければ詳細ページで代替
      if (ext) resolved++;
      results.push({
        id: generateId(siteUrl),
        title: it.title.slice(0, 100),
        url: siteUrl,
        thumbnailUrl: it.thumbnailUrl,
        source: "onepagelove",
        category: it.categories.length > 0 ? it.categories : ["one page"],
        taste: [],
        date: it.date,
        starred: false,
      });
      await sleep(300);
    }
  });
  await Promise.all(workers);

  console.log(
    `  ✅ One Page Love: ${results.length} 件（外部URL解決 ${resolved}/${rssItems.length}）`
  );
  return results;
}

if (require.main === module) {
  const pages = parseInt(process.env.ONEPAGELOVE_PAGES || "3", 10);
  scrapeOnePageLove(pages)
    .then((r) => {
      console.log(`\n合計 ${r.length} 件`);
      console.log(JSON.stringify(r.slice(0, 3), null, 2));
    })
    .catch(console.error);
}
