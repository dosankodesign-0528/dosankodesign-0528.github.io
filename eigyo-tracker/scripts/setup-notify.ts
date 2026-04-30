import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const targetEmail = "dosanko.design@gmail.com";

  console.log("=== 1. ユーザーID取得 ===");
  const usersRes: any = await notion.users.list({ page_size: 100 });
  let userId: string | null = null;
  let userName: string | null = null;
  for (const u of usersRes.results) {
    if (u.type === "person" && u.person?.email === targetEmail) {
      userId = u.id;
      userName = u.name;
      break;
    }
  }
  if (!userId) {
    console.error(`❌ ${targetEmail} のユーザーが見つかりませんでした`);
    console.error("登録されているユーザー:");
    for (const u of usersRes.results) {
      console.error(`  - ${u.name} (${u.type}) ${u.type === "person" ? u.person?.email ?? "" : ""}`);
    }
    process.exit(1);
  }
  console.log(`  ✅ User: ${userName} (${userId})`);

  console.log("\n=== 2. 通知用ページ作成 ===");
  const dbId = getCompaniesDbId();
  const db: any = await notion.databases.retrieve({ database_id: dbId });
  const parent = db.parent;
  let parentId: string;
  if (parent.type === "page_id") parentId = parent.page_id;
  else if (parent.type === "block_id") parentId = parent.block_id;
  else {
    console.error("親ページが特定できません");
    process.exit(1);
  }

  const created: any = await notion.pages.create({
    parent: { type: "page_id", page_id: parentId },
    properties: {
      title: [{ type: "text", text: { content: "📬 営業同期 通知" } }],
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: "ここに同期結果や月次レポートの通知が届きます。新規追加があったタイミングと月初にメンション通知が来ます。" } }],
        },
      },
    ],
  });
  console.log(`  ✅ ページ作成完了`);
  console.log(`     ID: ${created.id}`);
  console.log(`     URL: ${created.url}`);

  console.log("\n📝 .env と GitHub Secrets に以下を追加してください:");
  console.log(`   NOTION_USER_ID=${userId}`);
  console.log(`   NOTION_NOTIFY_PAGE_ID=${created.id.replace(/-/g, "")}`);
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
