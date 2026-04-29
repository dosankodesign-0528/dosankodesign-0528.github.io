import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  console.log("Adding 媒体 column to DB...");
  await notion.databases.update({
    database_id: dbId,
    properties: {
      媒体: {
        multi_select: {
          options: [
            { name: "Wantedly", color: "blue" },
            { name: "Green", color: "green" },
            { name: "問合せフォーム", color: "yellow" },
            { name: "直営業", color: "orange" },
            { name: "その他", color: "gray" },
          ],
        },
      },
    },
  });
  console.log("✅ 媒体カラム追加完了！");
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
