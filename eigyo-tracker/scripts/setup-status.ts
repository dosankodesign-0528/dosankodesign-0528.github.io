import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const db: any = await notion.databases.retrieve({ database_id: dbId });
  const reactionProp = db.properties["反応"];
  if (!reactionProp || reactionProp.type !== "select") {
    console.error("反応 select プロパティが見つかりません");
    process.exit(1);
  }
  const existing = reactionProp.select.options.map((o: any) => ({
    name: o.name,
    color: o.color,
  }));
  if (existing.some((o: any) => o.name === "N: 対象外")) {
    console.log("✅ 既に「N: 対象外」が登録されています");
    return;
  }
  const newOptions = [...existing, { name: "N: 対象外", color: "gray" }];
  await notion.databases.update({
    database_id: dbId,
    properties: {
      反応: {
        select: { options: newOptions },
      },
    },
  });
  console.log("✅ 「反応」カラムに「N: 対象外」選択肢を追加しました");
  console.log("   現在の選択肢:");
  for (const opt of newOptions) {
    console.log(`     - ${opt.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
