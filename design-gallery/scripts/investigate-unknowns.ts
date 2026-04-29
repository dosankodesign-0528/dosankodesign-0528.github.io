/**
 * 「不明」サイトの多角的調査スクリプト
 *
 * check-dead-links で undef のまま残ってるサイト + failedChecks>=1 のサイトに対して、
 * 通常の fetch だけで判定が難しいケースを 3段階で判別する：
 *
 *   Step 1) DNS 解決
 *     - dns.lookup で名前解決できなければサーバー消滅 → dead
 *     - 解決できたら次へ
 *
 *   Step 2) Playwright（実ブラウザ）レンダリング
 *     - JavaScript 必須サイトや Cloudflare bot ブロックを抜けて実画面を取得
 *     - タイトル/本文に「404 / 403 / Not Found / 売却 / 終了」等のキーワード
 *     - DOM テキスト量が極端に少ない → dead
 *     - 正常に開けてコンテンツがあれば alive
 *
 *   Step 3) それでも判定不能なものを CSV に書き出して目視確認用に残す
 *     - ./tmp/unknowns-pending-review.csv (URL, タイトル, 理由, スクショパス)
 *
 * 結果は scraped-sites.json に反映:
 *   - alive 判定 → isDead=false, failedChecks=0
 *   - dead  判定 → isDead=true
 *   - 判定不能 → そのまま（未変更、CSV に出力）
 *
 * 使い方:
 *   npx tsx scripts/investigate-unknowns.ts                # 全件
 *   LIMIT=20 npx tsx scripts/investigate-unknowns.ts       # 先頭20件だけ（テスト）
 *   SKIP_PLAYWRIGHT=1 npx tsx scripts/investigate-unknowns.ts  # Step1のみ
 *   DRY=1 npx tsx scripts/investigate-unknowns.ts          # 結果保存しない
 */

import * as fs from "fs";
import * as path from "path";
import * as dns from "dns";
import { promisify } from "util";
import { chromium, Browser } from "playwright";

const dnsLookup = promisify(dns.lookup);

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
const REVIEW_CSV_PATH = path.join(__dirname, "..", "tmp", "unknowns-pending-review.csv");
const REVIEW_DIR = path.dirname(REVIEW_CSV_PATH);
const SCREENSHOT_DIR = path.join(__dirname, "..", "tmp", "screenshots");

const LIMIT = parseInt(process.env.LIMIT || "0", 10);
const SKIP_PLAYWRIGHT = process.env.SKIP_PLAYWRIGHT === "1";
const DRY = process.env.DRY === "1";
const PLAYWRIGHT_CONCURRENCY = parseInt(process.env.PW_CONCURRENCY || "3", 10);
const NAV_TIMEOUT_MS = 20_000;

interface ScrapedSite {
  id: string;
  title: string;
  url: string;
  source: string;
  isDead?: boolean;
  failedChecks?: number;
  lastCheckedAt?: string;
  [key: string]: unknown;
}

type Verdict =
  | { result: "alive"; reason: string }
  | { result: "dead"; reason: string }
  | { result: "unknown"; reason: string };

// ============================================================
// Step 1: DNS チェック
// ============================================================
async function checkDns(url: string): Promise<Verdict | null> {
  try {
    const host = new URL(url).hostname;
    if (!host) return null;
    try {
      await dnsLookup(host);
      return null; // 解決できた → 次のステップへ
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      // ENOTFOUND / EAI_AGAIN は名前解決不能 = サイト消滅
      if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
        return { result: "dead", reason: `DNS 解決不能 (${code})` };
      }
      // 一時的エラーの可能性は unknown
      return { result: "unknown", reason: `DNS error: ${code || (e as Error).message}` };
    }
  } catch {
    return null;
  }
}

// ============================================================
// Step 2: Playwright レンダリング
// ============================================================
const DEAD_PATTERNS = [
  /404\s*not\s*found/i,
  /403\s*forbidden/i,
  /access\s*denied/i,
  /this\s*site\s*can'?t\s*be\s*reached/i,
  /server\s*not\s*found/i,
  /domain\s*(is\s*)?for\s*sale/i,
  /buy\s*this\s*domain/i,
  /expired\s*domain/i,
  /account\s*suspended/i,
  /this\s*account\s*has\s*been\s*suspended/i,
  /ページが見つかりません/,
  /お探しのページ.*見つかり/,
  /サイトが見つかりません/,
  /このドメインは販売中/,
  /お名前\.com/,
  /サービス(は|を)?\s*終了/,
  /サイト(は|を)?\s*閉鎖/,
  /サーバが見つかりません/,
];

async function checkPlaywright(
  browser: Browser,
  url: string
): Promise<Verdict> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "ja-JP",
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  // 重いリソースをブロックして高速化
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });

  try {
    let resp;
    try {
      // SPA(Framer/Next/Astro 等) は domcontentloaded だけだと body が空のケース多い。
      // networkidle まで待ち、JS でレンダリングが終わった状態で計測する。
      resp = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: NAV_TIMEOUT_MS,
      });
    } catch (e) {
      const msg = (e as Error).message || "";
      // ナビゲーション自体が失敗 = サイト消滅濃厚
      if (
        msg.includes("ERR_NAME_NOT_RESOLVED") ||
        msg.includes("net::ERR_NAME_NOT_RESOLVED")
      ) {
        return { result: "dead", reason: "ブラウザでも DNS 解決不能" };
      }
      if (msg.includes("ERR_CONNECTION_REFUSED")) {
        return { result: "dead", reason: "接続拒否" };
      }
      if (msg.includes("Timeout") || msg.includes("timeout")) {
        return { result: "unknown", reason: "ナビゲーションタイムアウト" };
      }
      return { result: "unknown", reason: `Playwright nav 失敗: ${msg.slice(0, 80)}` };
    }

    const status = resp?.status() ?? 0;
    if (status === 404 || status === 410 || status === 451) {
      return { result: "dead", reason: `HTTP ${status} (Playwright)` };
    }

    // タイトル + 本文テキスト + DOM サイズを取得
    const title = (await page.title().catch(() => "")) || "";
    const metrics = await page
      .evaluate(() => {
        const innerText = document.body?.innerText || "";
        const innerHTMLLen = document.body?.innerHTML?.length ?? 0;
        // 「画像が1枚以上ある」「リンクが3つ以上ある」「DOM が深い」のいずれかで
        // 普通のWebページっぽさを判定
        const imgCount = document.querySelectorAll("img").length;
        const linkCount = document.querySelectorAll("a[href]").length;
        const elementCount = document.querySelectorAll("*").length;
        return {
          innerText: innerText.slice(0, 5000),
          innerHTMLLen,
          imgCount,
          linkCount,
          elementCount,
        };
      })
      .catch(() => ({
        innerText: "",
        innerHTMLLen: 0,
        imgCount: 0,
        linkCount: 0,
        elementCount: 0,
      }));

    const blob = `${title}\n${metrics.innerText}`;
    if (DEAD_PATTERNS.some((re) => re.test(blob))) {
      return {
        result: "dead",
        reason: "ページに死亡キーワード検出 (title/body)",
      };
    }

    const cleanLen = metrics.innerText.replace(/\s+/g, " ").trim().length;
    const titleLen = title.replace(/\s+/g, " ").trim().length;

    // 本文テキスト極小 + タイトル極小 + DOM も貧弱 → ほぼ真っ白
    if (
      cleanLen < 30 &&
      titleLen < 5 &&
      metrics.innerHTMLLen < 500 &&
      metrics.elementCount < 30
    ) {
      return {
        result: "dead",
        reason: `ほぼ真っ白 (text=${cleanLen}, html=${metrics.innerHTMLLen}, el=${metrics.elementCount})`,
      };
    }

    // 「普通のWebサイトっぽさ」がある → alive 認定。SPA も innerHTML が大きければ alive。
    const looksLikeWebsite =
      titleLen >= 3 ||
      cleanLen >= 50 ||
      metrics.innerHTMLLen >= 2000 ||
      metrics.imgCount >= 1 ||
      metrics.linkCount >= 3 ||
      metrics.elementCount >= 30;

    if (status === 404 || status === 410 || status === 451) {
      return { result: "dead", reason: `HTTP ${status} (Playwright 後)` };
    }

    if (status >= 200 && status < 400 && looksLikeWebsite) {
      return {
        result: "alive",
        reason: `HTTP ${status} OK (text=${cleanLen}, html=${metrics.innerHTMLLen}, el=${metrics.elementCount})`,
      };
    }
    if (status === 403 && looksLikeWebsite) {
      return {
        result: "alive",
        reason: `403 だが Playwright で実コンテンツ取得 (html=${metrics.innerHTMLLen})`,
      };
    }
    if (status === 0 && looksLikeWebsite) {
      return { result: "alive", reason: "status=0 だが Web サイトっぽさあり" };
    }

    // 5xx は一時障害かもしれないので unknown のまま
    if (status >= 500) {
      return { result: "unknown", reason: `HTTP ${status} (一時障害かも)` };
    }
    return {
      result: "unknown",
      reason: `HTTP ${status} 判定保留 (text=${cleanLen}, html=${metrics.innerHTMLLen}, el=${metrics.elementCount})`,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

// ============================================================
// メイン
// ============================================================
async function main() {
  console.log("🔬 不明サイトの多角的調査");
  console.log("=".repeat(60));

  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  let targets = sites
    .map((s, i) => ({ s, i }))
    .filter(
      ({ s }) => s.isDead === undefined || (s.failedChecks ?? 0) >= 1
    );
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);
  console.log(`📊 対象: ${targets.length} 件`);

  // ----- Step 1: DNS チェック (並列度 30) -----
  console.log("\n[Step 1] DNS チェック中...");
  const dnsResults = new Map<number, Verdict>();
  let dnsDoneCount = 0;
  const DNS_CONC = 30;
  let dnsCursor = 0;
  await Promise.all(
    Array.from({ length: DNS_CONC }, async () => {
      while (dnsCursor < targets.length) {
        const i = dnsCursor++;
        const { s, i: siteIdx } = targets[i];
        const v = await checkDns(s.url);
        if (v) dnsResults.set(siteIdx, v);
        dnsDoneCount++;
        if (dnsDoneCount % 50 === 0) {
          process.stdout.write(`\r  DNS ${dnsDoneCount}/${targets.length}`);
        }
      }
    })
  );
  process.stdout.write("\n");
  const dnsDeadCount = Array.from(dnsResults.values()).filter(
    (v) => v.result === "dead"
  ).length;
  console.log(`  DNS で dead 判定: ${dnsDeadCount} 件`);

  // ----- Step 2: Playwright (DNS で確定しなかったやつだけ) -----
  const remaining = targets.filter(
    ({ i }) => !dnsResults.has(i) || dnsResults.get(i)!.result === "unknown"
  );
  let playwrightResults = new Map<number, Verdict>();
  if (!SKIP_PLAYWRIGHT && remaining.length > 0) {
    console.log(
      `\n[Step 2] Playwright で残り ${remaining.length} 件をレンダリング (並列 ${PLAYWRIGHT_CONCURRENCY})...`
    );
    const browser = await chromium.launch({ headless: true });
    let pwDone = 0;
    let pwCursor = 0;
    await Promise.all(
      Array.from({ length: PLAYWRIGHT_CONCURRENCY }, async () => {
        while (pwCursor < remaining.length) {
          const i = pwCursor++;
          const { s, i: siteIdx } = remaining[i];
          try {
            const v = await checkPlaywright(browser, s.url);
            playwrightResults.set(siteIdx, v);
          } catch (e) {
            playwrightResults.set(siteIdx, {
              result: "unknown",
              reason: "Playwright 例外: " + (e as Error).message.slice(0, 80),
            });
          }
          pwDone++;
          if (pwDone % 5 === 0 || pwDone === remaining.length) {
            process.stdout.write(`\r  Playwright ${pwDone}/${remaining.length}`);
          }
        }
      })
    );
    process.stdout.write("\n");
    await browser.close();
  } else if (SKIP_PLAYWRIGHT) {
    console.log("\n[Step 2] SKIP_PLAYWRIGHT=1 のためスキップ");
  }

  // ----- 結果反映 + CSV 出力 -----
  let aliveCount = 0;
  let deadCount = 0;
  let pendingCount = 0;
  const pending: { site: ScrapedSite; reason: string; screenshotPath?: string }[] = [];
  const nowIso = new Date().toISOString();

  for (const { s, i } of targets) {
    const verdict = dnsResults.get(i) ?? playwrightResults.get(i);
    if (!verdict || verdict.result === "unknown") {
      pendingCount++;
      pending.push({
        site: s,
        reason: verdict?.reason ?? "判定不能",
      });
      continue;
    }
    if (verdict.result === "alive") {
      sites[i].isDead = false;
      sites[i].failedChecks = 0;
      sites[i].lastCheckedAt = nowIso;
      aliveCount++;
    } else if (verdict.result === "dead") {
      sites[i].isDead = true;
      sites[i].lastCheckedAt = nowIso;
      deadCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 結果:");
  console.log(`  alive 認定: ${aliveCount}`);
  console.log(`  dead  認定: ${deadCount}`);
  console.log(`  保留 (要目視): ${pendingCount}`);

  // ----- Step 3: 保留分のスクショを撮影（Claude が画像で目視判定するため） -----
  if (pending.length > 0 && !SKIP_PLAYWRIGHT) {
    console.log(
      `\n[Step 3] 保留 ${pending.length} 件のスクショ撮影 (Claude 目視判定用)...`
    );
    if (!fs.existsSync(SCREENSHOT_DIR))
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    let shotDone = 0;
    let shotCursor = 0;
    await Promise.all(
      Array.from({ length: PLAYWRIGHT_CONCURRENCY }, async () => {
        while (shotCursor < pending.length) {
          const i = shotCursor++;
          const item = pending[i];
          const filename = `${item.site.id}.png`;
          const fullPath = path.join(SCREENSHOT_DIR, filename);
          const ctx = await browser.newContext({
            userAgent:
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport: { width: 1280, height: 800 },
            locale: "ja-JP",
            ignoreHTTPSErrors: true,
          });
          const page = await ctx.newPage();
          try {
            await page.goto(item.site.url, {
              waitUntil: "domcontentloaded",
              timeout: 25_000,
            });
            // ちょっと待って描画完了させる
            await page.waitForTimeout(2500);
            await page.screenshot({
              path: fullPath,
              fullPage: false,
              type: "png",
            });
            item.screenshotPath = path.relative(
              path.join(__dirname, ".."),
              fullPath
            );
          } catch (e) {
            // 撮れないサイト = 多分 dead 寄り。ファイルは作らない。
            void e;
          } finally {
            await ctx.close().catch(() => {});
            shotDone++;
            if (shotDone % 5 === 0 || shotDone === pending.length) {
              process.stdout.write(`\r  撮影 ${shotDone}/${pending.length}`);
            }
          }
        }
      })
    );
    process.stdout.write("\n");
    await browser.close();
  }

  // 保留分は CSV に出力（Claude が読んで目視判定する用）
  if (pending.length > 0) {
    if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR, { recursive: true });
    const lines = [
      "id,url,title,source,reason,screenshot",
      ...pending.map(({ site, reason, screenshotPath }) =>
        [
          site.id,
          `"${site.url.replace(/"/g, '""')}"`,
          `"${(site.title ?? "").replace(/"/g, '""')}"`,
          site.source,
          `"${reason.replace(/"/g, '""')}"`,
          screenshotPath ?? "",
        ].join(",")
      ),
    ];
    fs.writeFileSync(REVIEW_CSV_PATH, lines.join("\n"), "utf-8");
    console.log(`\n📝 目視確認用 CSV: ${REVIEW_CSV_PATH}`);
    const withShot = pending.filter((p) => p.screenshotPath).length;
    console.log(`   スクショ撮影成功: ${withShot}/${pending.length} 件`);
    console.log(`   スクショなし(撮影失敗=dead寄り): ${pending.length - withShot} 件`);
  }

  if (DRY) {
    console.log("\n--dry のため scraped-sites.json は更新しません");
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(sites, null, 2), "utf-8");
  console.log("\n💾 保存完了: " + DATA_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
