import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const db: any = await notion.databases.retrieve({ database_id: dbId });
  const parent = db.parent;
  let parentPageId: string;
  if (parent.type === "page_id") {
    parentPageId = parent.page_id;
  } else if (parent.type === "block_id") {
    parentPageId = parent.block_id;
  } else {
    console.error("デザイン制作会社DBの親が特定できません");
    console.error(`parent: ${JSON.stringify(parent)}`);
    process.exit(1);
  }
  console.log(`親ID: ${parentPageId} (type: ${parent.type})`);

  const created: any = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "営業同期 月次レポート" } }],
    properties: {
      期間: { title: {} },
      開始日: { date: {} },
      終了日: { date: {} },
      新規追加件数: { number: { format: "number" } },
      更新件数: { number: { format: "number" } },
      "Wantedly件数": { number: { format: "number" } },
      "Green件数": { number: { format: "number" } },
      問合せフォーム件数: { number: { format: "number" } },
      直営業件数: { number: { format: "number" } },
      "N対象外件数": { number: { format: "number" } },
      拾い損ねメール: { number: { format: "number" } },
      頻出キーワード: { rich_text: {} },
      備考: { rich_text: {} },
    },
  });
  console.log(`✅ 月次レポートDB作成完了`);
  console.log(`   DB ID: ${created.id}`);
  console.log(`   URL: ${created.url}`);
  console.log("");
  console.log("📝 .env と GitHub Secrets に以下を追加してください:");
  console.log(`   NOTION_REPORT_DB_ID=${created.id.replace(/-/g, "")}`);
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
