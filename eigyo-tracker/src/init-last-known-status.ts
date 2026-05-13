/**
 * 一回限りの初期化スクリプト：
 *   会社DB の「前回ステータス（自動）」が空の会社に、現在のステータスを書き込む。
 *
 * Phase 2（手動編集検知）デプロイ後の初回だけ実行。
 * これをやらないと、毎回の sync で初期化が走って timeout する。
 *
 * 実行: workflow_dispatch (init-last-known-status.yml)
 */
import "dotenv/config";
import {
  buildNotionClient,
  fetchAllCompanies,
  getCompaniesDbId,
  getStatusChangeLogDbId,
  syncLastKnownStatus,
} from "./notion.js";
import { resolveSchema } from "./schema-resolver.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const schema = await resolveSchema(notion, dbId, getStatusChangeLogDbId());
  const companyNames = schema.companies;
  console.log(`[init] 会社DB読み込み中...`);
  const companies = await fetchAllCompanies(notion, dbId, companyNames);
  console.log(`[init] 全会社: ${companies.length}`);

  const targets = companies.filter((c) => c.status && !c.lastKnownStatus);
  console.log(`[init] 初期化対象（前回ステータス空）: ${targets.length} 社`);
  if (targets.length === 0) {
    console.log(`[init] 全社初期化済み。終了。`);
    return;
  }

  let ok = 0;
  let ng = 0;
  for (const c of targets) {
    try {
      await syncLastKnownStatus(notion, companyNames, c.pageId, c.status!);
      ok++;
      if (ok % 50 === 0) console.log(`  進捗: ${ok}/${targets.length}`);
    } catch (err: any) {
      console.error(`  ✗ ${c.name}: ${err?.message ?? err}`);
      ng++;
    }
    // Notion API rate limit 対策（3 req/sec ≈ 333ms 間隔）
    await sleep(350);
  }
  console.log(`[init] done: ${ok} 成功 / ${ng} 失敗`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
