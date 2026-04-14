/**
 * フルページスクリーンショット バッチキャプチャスクリプト
 *
 * Playwrightで各サイトのトップページ全体をキャプチャし、
 * public/screenshots/{id}.webp に保存する
 *
 * 使い方: npx tsx scripts/capture-screenshots.ts [--limit 100] [--concurrency 5]
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

interface SiteData {
  id: string;
  url: string;
  title: string;
}

const SCREENSHOTS_DIR = path.join(__dirname, "..", "public", "screenshots");
const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");

// コマンドライン引数
const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const concIdx = args.indexOf("--concurrency");
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const CONCURRENCY = concIdx >= 0 ? parseInt(args[concIdx + 1], 10) : 5;

async function captureSite(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>,
  site: SiteData,
  index: number,
  total: number
): Promise<boolean> {
  const outputPath = path.join(SCREENSHOTS_DIR, `${site.id}.jpg`);

  // 既にキャプチャ済みならスキップ
  if (fs.existsSync(outputPath)) {
    console.log(`  [${index}/${total}] スキップ（キャプチャ済み）: ${site.title}`);
    return true;
  }

  try {
    await page.goto(site.url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // ページが読み込まれるのを少し待つ
    await page.waitForTimeout(2000);

    // フルページスクリーンショット
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: "jpeg",
      quality: 50,
    });

    console.log(`  [${index}/${total}] ✅ ${site.title}`);
    return true;
  } catch (e) {
    console.log(`  [${index}/${total}] ❌ ${site.title}: ${(e as Error).message.slice(0, 80)}`);
    return false;
  }
}

async function main() {
  // データ読み込み
  const sites: SiteData[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  // キャプチャ対象（既にキャプチャ済みを除外してカウント）
  const remaining = sites.filter(
    (s) => !fs.existsSync(path.join(SCREENSHOTS_DIR, `${s.id}.webp`))
  );
  const target = remaining.slice(0, LIMIT);

  console.log("📸 フルページスクリーンショット キャプチャ開始");
  console.log(`   全サイト: ${sites.length}件`);
  console.log(`   キャプチャ済み: ${sites.length - remaining.length}件`);
  console.log(`   今回の対象: ${target.length}件`);
  console.log(`   同時実行数: ${CONCURRENCY}`);
  console.log("=".repeat(50));

  // ディレクトリ確認
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // ブラウザ起動
  const browser = await chromium.launch({ headless: true });
  let success = 0;
  let fail = 0;

  // 並列キャプチャ（CONCURRENCY分ずつ）
  for (let i = 0; i < target.length; i += CONCURRENCY) {
    const batch = target.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (site, batchIdx) => {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 800 },
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });
        const page = await context.newPage();

        // 不要なリソースをブロック（高速化）
        await page.route("**/*", (route) => {
          const type = route.request().resourceType();
          if (["media", "font", "websocket"].includes(type)) {
            return route.abort();
          }
          return route.continue();
        });

        const result = await captureSite(page, site, i + batchIdx + 1, target.length);
        await context.close();
        return result;
      })
    );

    results.forEach((r) => (r ? success++ : fail++));
  }

  await browser.close();

  console.log("\n" + "=".repeat(50));
  console.log(`📊 結果: 成功 ${success}件 / 失敗 ${fail}件`);

  // screenshot-ids.json を生成（全キャプチャ済みIDリスト）
  const allCaptured = fs.readdirSync(SCREENSHOTS_DIR)
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => f.replace(".jpg", ""));
  const idsPath = path.join(__dirname, "..", "src", "data", "screenshot-ids.json");
  fs.writeFileSync(idsPath, JSON.stringify(allCaptured), "utf-8");
  console.log(`   キャプチャ済み合計: ${allCaptured.length}件`);
  console.log(`✅ screenshot-ids.json 更新完了`);
}

main().catch(console.error);
