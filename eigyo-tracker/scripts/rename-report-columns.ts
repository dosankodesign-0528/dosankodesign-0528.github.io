import "dotenv/config";
import { buildNotionClient } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const reportDbId = process.env.NOTION_REPORT_DB_ID;
  if (!reportDbId) {
    console.error("NOTION_REPORT_DB_ID missing");
    process.exit(1);
  }
  console.log("=== レポートDBカラムをリネーム ===");
  await notion.databases.update({
    database_id: reportDbId,
    properties: {
      問合せフォーム件数: { name: "直メール/フォーム件数" },
      直営業件数: { name: "SNS件数" },
    },
  });
  console.log("✅ リネーム完了");
  console.log("   問合せフォーム件数 → 直メール/フォーム件数");
  console.log("   直営業件数 → SNS件数");
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
