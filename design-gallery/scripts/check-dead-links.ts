/**
 * scraped-sites.json の全URLを疎通チェックして、リンク切れに isDead フラグを立てる。
 *
 * 戦略:
 *   - まず HEAD を試す。405/501 など一部サーバーは HEAD を嫌うので、その時は GET にフォールバック。
 *   - タイムアウトは各URL 10秒。
 *   - 並列数は 20。
 *   - lastCheckedAt が直近 14日以内のエントリはスキップ（再検査しない）。
 *   - 判定:
 *       - 200-399 ⇒ alive (isDead = false)
 *       - 404, 410, 451 等の終端エラー ⇒ dead (isDead = true)
 *       - タイムアウト・ネットエラー ⇒ 不明として isDead は触らない（既存値維持）
 *
 * 使い方:
 *   npm run check-links              # 14日以上古いものだけチェック
 *   npm run check-links -- --all     # 全件強制チェック
 *   npm run check-links -- --dry     # 結果を表示するだけで保存しない
 */

import * as fs from "fs";
import * as path from "path";

interface ScrapedSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  category: string[];
  taste: string[];
  agency?: string;
  date: string;
  starred: boolean;
  isAgency?: boolean;
  firstSeen?: string;
  isDead?: boolean;
  lastCheckedAt?: string;
}

const CONCURRENCY = 20;
const TIMEOUT_MS = 10_000;
const STALE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14日
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

type CheckResult = "alive" | "dead" | "unknown";

// ドメインパーキング / 販売中 / サイト消滅の典型パターン
// （大文字小文字は正規化してマッチ）
const PARKED_HOST_PATTERNS = [
  /(^|\.)sedoparking\.com$/i,
  /(^|\.)parking\.godaddy\.com$/i,
  /(^|\.)parkingcrew\.net$/i,
  /(^|\.)bodis\.com$/i,
  /(^|\.)dan\.com$/i,
  /(^|\.)afternic\.com$/i,
  /(^|\.)hugedomains\.com$/i,
  /(^|\.)uniregistry\.com$/i,
  /(^|\.)undeveloped\.com$/i,
  /(^|\.)above\.com$/i,
  /(^|\.)namebright\.com$/i,
  /(^|\.)cashparking\.com$/i,
];

const DEAD_TEXT_PATTERNS = [
  /このドメインは販売中/,
  /このドメインは、?お名前\.com/,
  /このサイトは移転しました/,
  /domain\s+is\s+for\s+sale/i,
  /buy\s+this\s+domain/i,
  /this\s+domain\s+may\s+be\s+for\s+sale/i,
  /checkout\s+the\s+full\s+details/i,
  /expired\s+domain/i,
  /domain\s+has\s+expired/i,
  /domain\s+parking/i,
  /account\s+(has\s+been\s+)?suspended/i,
  /this\s+account\s+has\s+been\s+suspended/i,
  /site\s+not\s+found/i,
  /404\s+not\s+found/i,
  /ページが見つかりません/,
  /お探しのページ.*見つかり/,
  /サイトが見つかりません/,
  /サービスは終了/,
  /このサイトは閉鎖/,
  /closed\s+permanently/i,
];

async function checkOne(url: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const doFetch = async (method: "HEAD" | "GET"): Promise<Response> => {
    return fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
  };

  try {
    let res: Response;
    try {
      res = await doFetch("HEAD");
      if (res.status === 405 || res.status === 501) {
        res = await doFetch("GET");
      }
    } catch {
      res = await doFetch("GET");
    }

    // 終端エラーはこの時点で確定
    if ([404, 410, 451, 400].includes(res.status)) {
      clearTimeout(timer);
      return "dead";
    }

    // リダイレクト後のホスト名が典型的なパーキングドメインに変わっていたら dead
    try {
      const finalHost = new URL(res.url).hostname;
      if (PARKED_HOST_PATTERNS.some((re) => re.test(finalHost))) {
        clearTimeout(timer);
        return "dead";
      }
    } catch {
      // URL 解析失敗は無視
    }

    // 2xx/3xx の場合は本文も軽く覗いて「パーキング / サイト消滅」テキストを拾う
    if (res.status >= 200 && res.status < 400) {
      // HEAD だと本文が無いので GET を引き直す
      let bodyRes: Response = res;
      if (!res.body || res.headers.get("content-length") === "0") {
        try {
          bodyRes = await doFetch("GET");
        } catch {
          bodyRes = res;
        }
      }

      // Content-Type が HTML 系の時だけテキスト判定
      const ctype = bodyRes.headers.get("content-type") || "";
      if (ctype.includes("text/html") || ctype.includes("application/xhtml")) {
        try {
          const buf = await bodyRes.arrayBuffer();
          // 先頭 64KB だけ見れば十分
          const slice = buf.slice(0, 64 * 1024);
          const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);

          // パーキング / 消滅テキストを検出
          if (DEAD_TEXT_PATTERNS.some((re) => re.test(text))) {
            clearTimeout(timer);
            return "dead";
          }

          // 極端に中身が薄い（HTMLタグ剥がして 200 文字未満）ケース：
          // 怪しいけど誤検出怖いので unknown にとどめる
          const stripped = text
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          if (stripped.length < 40) {
            clearTimeout(timer);
            return "unknown";
          }
        } catch {
          // 本文読取失敗は判定に使わない
        }
      }

      clearTimeout(timer);
      return "alive";
    }

    clearTimeout(timer);
    // 5xx や 403 は一時的かもしれないので unknown
    return "unknown";
  } catch (e) {
    clearTimeout(timer);
    const msg = (e as Error).message || "";
    if (
      msg.includes("ENOTFOUND") ||
      msg.includes("EAI_AGAIN") ||
      msg.includes("ERR_NAME_NOT_RESOLVED")
    ) {
      return "dead";
    }
    return "unknown";
  }
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  let done = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
      done++;
      if (onProgress && (done % 20 === 0 || done === items.length)) {
        onProgress(done, items.length);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes("--all");
  const dryRun = args.includes("--dry");

  const jsonPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ ${jsonPath} が見つかりません。先に npm run scrape を実行してください。`);
    process.exit(1);
  }
  const sites = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as ScrapedSite[];
  console.log(`📦 読み込み: ${sites.length} 件`);

  const now = Date.now();
  const targets: { index: number; site: ScrapedSite }[] = [];
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    if (forceAll) {
      targets.push({ index: i, site: s });
      continue;
    }
    // 前回チェックが直近ならスキップ
    if (s.lastCheckedAt) {
      const last = new Date(s.lastCheckedAt).getTime();
      if (now - last < STALE_THRESHOLD_MS) continue;
    }
    targets.push({ index: i, site: s });
  }

  console.log(
    `🔍 チェック対象: ${targets.length} 件 (全体: ${sites.length}, 直近チェック済みスキップ: ${
      sites.length - targets.length
    })`
  );
  if (targets.length === 0) {
    console.log("✅ 全てのURLが最近チェック済みです。--all で強制再チェックできます。");
    return;
  }

  let deadCount = 0;
  let aliveCount = 0;
  let unknownCount = 0;

  const startedAt = Date.now();
  await runPool(
    targets,
    CONCURRENCY,
    async ({ index, site }) => {
      const result = await checkOne(site.url);
      const nowIso = new Date().toISOString();
      if (result === "alive") {
        sites[index].isDead = false;
        sites[index].lastCheckedAt = nowIso;
        aliveCount++;
      } else if (result === "dead") {
        sites[index].isDead = true;
        sites[index].lastCheckedAt = nowIso;
        deadCount++;
      } else {
        // unknown: 結果を保存しない（次回再チェック）
        unknownCount++;
      }
    },
    (done, total) => {
      const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
      process.stdout.write(
        `\r  進捗: ${done}/${total} (死${deadCount} / 生${aliveCount} / 不明${unknownCount}) 経過${elapsedMin}分  `
      );
    }
  );
  process.stdout.write("\n");

  console.log("\n" + "=".repeat(50));
  console.log(`📊 結果:`);
  console.log(`  生きてる:  ${aliveCount} 件`);
  console.log(`  リンク切れ: ${deadCount} 件`);
  console.log(`  不明(再試行): ${unknownCount} 件`);

  if (dryRun) {
    console.log(`\n🏃 dry-run のため保存はしません`);
    return;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(sites, null, 2), "utf-8");
  console.log(`\n✅ 保存完了: ${jsonPath}`);

  const totalDead = sites.filter((s) => s.isDead).length;
  console.log(`  (全体で isDead = ${totalDead} 件)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
