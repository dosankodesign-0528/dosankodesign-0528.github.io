import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const companiesDbId = getCompaniesDbId();
  const reportDbId = process.env.NOTION_REPORT_DB_ID;

  console.log("=== 1. デザイン制作会社DBから「N: 対象外」selectオプション削除 ===");
  const db: any = await notion.databases.retrieve({ database_id: companiesDbId });
  const reactionProp = db.properties["反応"];
  if (reactionProp?.type === "select") {
    const filtered = (reactionProp.select.options ?? []).filter((o: any) => o.name !== "N: 対象外");
    await notion.databases.update({
      database_id: companiesDbId,
      properties: {
        反応: { select: { options: filtered } },
      },
    });
    console.log("  ✅ N: 対象外 オプション削除完了");
    console.log("  残存オプション:", filtered.map((o: any) => o.name).join(", "));
  } else {
    console.log("  反応 selectが見つからず");
  }

  if (reportDbId) {
    console.log("\n=== 2. 月次レポートDBから「N対象外件数」カラム削除 ===");
    await notion.databases.update({
      database_id: reportDbId,
      properties: {
        "N対象外件数": null as any,
      },
    });
    console.log("  ✅ N対象外件数カラム削除完了");
  }

  console.log("\n🎉 クリーンアップ完了");
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
