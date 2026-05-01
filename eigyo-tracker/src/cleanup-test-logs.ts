/**
 * 一時的な掃除スクリプト（テストデータ7件をゴミ箱へ）
 *
 * IDS env か CLEANUP_IDS env で削除対象IDをカンマ区切りで指定。
 * 何も指定なければ、Phase 1 開発時に手動で投入したテストデータ7件のIDを使う。
 *
 * 実行: npx tsx src/cleanup-test-logs.ts
 *   or  workflow_dispatch（cleanup-test-logs.yml）
 */
import "dotenv/config";
import { buildNotionClient } from "./notion.js";

const DEFAULT_TEST_IDS = [
  "3539b3c4-ddc0-811c-ab9e-e6f0767b4631", // ジザイエ
  "3539b3c4-ddc0-81f5-a3e6-cbc3548d1b0f", // オロ
  "3539b3c4-ddc0-81a7-9dd8-c7ecc9fb8734", // Maromaro
  "3539b3c4-ddc0-8172-b7c9-cc210996c3b7", // ドクターズ
  "3539b3c4-ddc0-81f9-b4e8-cb1b98365276", // Asobica
  "3539b3c4-ddc0-81cb-8c57-e189958e5b21", // XAION DATA
  "3539b3c4-ddc0-8198-82b8-e39506634b32", // セレス
];

async function main() {
  const ids =
    (process.env.CLEANUP_IDS ?? process.env.IDS)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? DEFAULT_TEST_IDS;
  console.log(`[cleanup] ${ids.length} 件をゴミ箱へ移動します`);
  const notion = buildNotionClient();
  let ok = 0;
  let ng = 0;
  for (const id of ids) {
    try {
      await notion.pages.update({ page_id: id, archived: true });
      console.log(`  ✓ archived: ${id}`);
      ok++;
    } catch (err: any) {
      console.error(`  ✗ ${id}: ${err?.message ?? err}`);
      ng++;
    }
  }
  console.log(`[cleanup] done: ${ok} 成功 / ${ng} 失敗`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
