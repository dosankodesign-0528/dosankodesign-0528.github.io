/**
 * 81-web.com 専用スクレイパー（Playwright版）
 * Nuxt3 SPA なのでブラウザ実行が必要。
 *
 * 使い方:
 *   npx tsx scripts/scrape-81web.ts            # デフォルト（最大2000件）
 *   MAX_SITES=5500 npx tsx scripts/scrape-81web.ts  # ほぼ全件
 */
import { chromium, Page } from "playwright";
import * as crypto from "crypto";

export interface Scraped81Site {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: "81web";
  category: string[];
  taste: string[];
  agency?: string;
  date: string;
  starred: boolean;
}

function generateId(url: string): string {
  return crypto.createHash("md5").update(`81web:${url}`).digest("hex").slice(0, 12);
}

async function scrollAndWait(page: Page, targetCount: number, maxScrolls: number) {
  let stable = 0;
  let prev = 0;
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1800);
    const count = await page.locator(".p-gallery-list-card").count();
    if (count >= targetCount) {
      console.log(`  ${count} 件到達（目標 ${targetCount}）`);
      return count;
    }
    if (count === prev) {
      stable++;
      if (stable >= 3) {
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

export async function scrape81Web(targetCount: number = 2000): Promise<Scraped81Site[]> {
  console.log(`\n📝 81-web.com からスクレイピング開始（目標 ${targetCount} 件）`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    await page.goto("https://81-web.com/", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForSelector(".p-gallery-list-card", { timeout: 20000 });

    const totalAvailable = await page.evaluate(() => {
      const text = document.querySelector(".p-gallery-ui-count")?.textContent || "";
      const m = text.match(/of\s+([\d,]+)/i);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
    });
    console.log(`  サイト側の総件数: ${totalAvailable} 件`);

    const goal = Math.min(targetCount, totalAvailable || targetCount);
    const maxScrolls = Math.ceil(goal / 24) + 20; // 余裕
    const final = await scrollAndWait(page, goal, maxScrolls);
    console.log(`  最終ロード件数: ${final} 件`);

    const sites = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".p-gallery-list-card"));
      return cards.map((card) => {
        const img = card.querySelector("img.p-gallery-list-card__body__figure__img") as HTMLImageElement | null;
        const thumbnail = img?.getAttribute("src") || "";
        const title = img?.getAttribute("alt")?.trim() || "";
        // "Visit Site" 外部リンク
        const visit = Array.from(card.querySelectorAll("a[target='_blank']")).find(
          (a) => !(a as HTMLAnchorElement).href.includes("81-web.com")
        ) as HTMLAnchorElement | undefined;
        const url = visit?.href || "";
        const dateText = card.querySelector(".p-gallery-list-card__body__info__date")?.textContent?.trim() || "";
        // "2026.4.17" → "2026-04"
        const m = dateText.match(/(\d{4})\.(\d{1,2})/);
        const date = m ? `${m[1]}-${m[2].padStart(2, "0")}` : "";

        const defs = Array.from(card.querySelectorAll(".p-gallery-list-card__body__info__list__item"));
        const categories: string[] = [];
        let agency = "";
        for (const def of defs) {
          const term = def.querySelector("dt")?.textContent?.trim().replace(":", "").trim() || "";
          const desc = def.querySelector("dd")?.textContent?.trim() || "";
          if (!desc) continue;
          if (/Type|Category/i.test(term)) {
            // 複数カテゴリのケースあり
            desc.split(/[、,・\/]/).forEach((c) => {
              const trimmed = c.trim();
              if (trimmed) categories.push(trimmed);
            });
          } else if (/Agency|制作/i.test(term)) {
            agency = desc;
          }
        }

        return { title, url, thumbnail, date, categories, agency };
      });
    });

    const results: Scraped81Site[] = [];
    for (const s of sites) {
      if (!s.title || !s.url || !s.thumbnail) continue;
      results.push({
        id: generateId(s.url),
        title: s.title.slice(0, 100),
        url: s.url,
        thumbnailUrl: s.thumbnail,
        source: "81web",
        category: s.categories.length > 0 ? s.categories : ["uncategorized"],
        taste: [],
        agency: s.agency || undefined,
        date: s.date || new Date().toISOString().slice(0, 7),
        starred: false,
      });
    }

    console.log(`  ✅ ${results.length} 件 抽出完了`);
    return results;
  } finally {
    await browser.close();
  }
}

// CLI 実行
if (require.main === module) {
  const target = parseInt(process.env.MAX_SITES || "2000", 10);
  scrape81Web(target)
    .then((r) => {
      console.log(`\n📊 合計 ${r.length} 件`);
      console.log("先頭3件:", JSON.stringify(r.slice(0, 3), null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
