import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const db: any = await notion.databases.retrieve({ database_id: dbId });
  if (db.properties["最終接触日"]) {
    console.log("✅ 既に「最終接触日」カラムが存在します");
    return;
  }
  await notion.databases.update({
    database_id: dbId,
    properties: {
      最終接触日: { date: {} },
    },
  });
  console.log("✅ 「最終接触日」(date型) カラムを追加しました");
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
