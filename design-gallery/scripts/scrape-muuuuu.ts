/**
 * MUUUUU.ORG 専用スクレイパー（Playwright版）
 *
 * MUUUUU は `/page/N` 形式のページネーションが機能せず、トップページを
 * 無限スクロールで追加読み込みする AJAX 構造になっている。
 * そのため Playwright でブラウザを立ち上げ、スクロールで追加ロードさせる。
 *
 * 使い方:
 *   npx tsx scripts/scrape-muuuuu.ts
 *   MAX_MUUUUU=500 npx tsx scripts/scrape-muuuuu.ts
 */
import { chromium, Page } from "playwright";
import * as crypto from "crypto";

export interface ScrapedMuuuuuSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "muuuuu";
  category: string[];
  taste: string[];
  agency?: string;
  date: string; // YYYY-MM
  starred: boolean;
}

function generateId(url: string): string {
  return crypto.createHash("md5").update(`muuuuu:${url}`).digest("hex").slice(0, 12);
}

/** 画像パスの /wp-content/uploads/YYYY/MM/ から年月を拾う */
function extractDateFromImg(src: string): string {
  const m = src.match(/\/uploads\/(\d{4})\/(\d{2})\//);
  if (m) return `${m[1]}-${m[2]}`;
  return new Date().toISOString().slice(0, 7);
}

async function scrollUntilStable(page: Page, targetCount: number, maxScrolls: number): Promise<number> {
  let stable = 0;
  let prev = 0;
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const count = await page.locator(".c-post-list__item").count();
    if (count >= targetCount) {
      console.log(`  ${count} 件到達（目標 ${targetCount}）`);
      return count;
    }
    if (count === prev) {
      stable++;
      if (stable >= 4) {
        console.log(`  ${count} 件で打ち止め（これ以上増えへん）`);
        return count;
      }
    } else {
      stable = 0;
    }
    prev = count;
    if (i % 10 === 9) console.log(`  scroll ${i + 1}: ${count} 件`);
  }
  return prev;
}

export async function scrapeMuuuuu(targetCount: number = 1500): Promise<ScrapedMuuuuuSite[]> {
  console.log(`\n📝 MUUUUU.ORG からスクレイピング開始（目標 ${targetCount} 件）`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    await page.goto("https://muuuuu.org/", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector(".c-post-list__item", { timeout: 20000 });

    // ~16件/スクロール。目標件数 + 余裕
    const maxScrolls = Math.ceil(targetCount / 12) + 20;
    const final = await scrollUntilStable(page, targetCount, maxScrolls);
    console.log(`  最終ロード件数: ${final} 件`);

    type RawItem = {
      url: string;
      thumbnailUrl: string;
      title: string;
      category: string;
    };
    const items: RawItem[] = await page.evaluate(() => {
      const out: {
        url: string;
        thumbnailUrl: string;
        title: string;
        category: string;
      }[] = [];
      document.querySelectorAll(".c-post-list__item").forEach((el) => {
        const a = el.querySelector<HTMLAnchorElement>("a.c-post-list__link");
        const img = el.querySelector<HTMLImageElement>("img.c-post-list__image");
        if (!a || !img) return;
        const url = a.href;
        const thumbnailUrl = img.src;
        const title = (img.alt || "").trim();
        if (!url || !thumbnailUrl || !title) return;
        // 詳細ページのURLからカテゴリ推測（/color/white/xxx.html → white）
        const detail = el
          .querySelector<HTMLAnchorElement>("a.c-post-list__title-link")
          ?.getAttribute("href");
        let category = "uncategorized";
        if (detail) {
          const m = detail.match(/muuuuu\.org\/([a-z-]+)\/([a-z-]+)\/\d+/i);
          if (m) category = m[2];
        }
        out.push({ url, thumbnailUrl, title, category });
      });
      return out;
    });

    console.log(`  DOM抽出: ${items.length} 件`);

    const seen = new Set<string>();
    const sites: ScrapedMuuuuuSite[] = [];
    for (const raw of items) {
      if (seen.has(raw.url)) continue;
      seen.add(raw.url);
      sites.push({
        id: generateId(raw.url),
        title: raw.title.slice(0, 100),
        url: raw.url,
        thumbnailUrl: raw.thumbnailUrl,
        source: "muuuuu",
        category: [raw.category],
        taste: [],
        date: extractDateFromImg(raw.thumbnailUrl),
        starred: false,
      });
    }

    console.log(`  ユニーク件数: ${sites.length} 件`);
    return sites;
  } finally {
    await browser.close();
  }
}

// スタンドアロン実行
if (require.main === module) {
  const target = parseInt(process.env.MAX_MUUUUU || "1500", 10);
  scrapeMuuuuu(target)
    .then((sites) => {
      console.log(`\n✅ 完了: ${sites.length} 件`);
      console.log("最初の3件:", sites.slice(0, 3));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
