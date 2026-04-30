import "dotenv/config";
import { buildNotionClient, fetchAllCompanies, getCompaniesDbId } from "../src/notion.js";
import { cleanCompanyName } from "../src/classify.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  console.log("=== 全企業取得 ===");
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`Total: ${companies.length}`);

  const targets = companies
    .map((c) => ({ pageId: c.pageId, oldName: c.name, newName: cleanCompanyName(c.name) }))
    .filter((c) => c.newName && c.oldName !== c.newName && c.newName.length >= 1);

  console.log(`修正候補: ${targets.length} 件`);
  if (targets.length === 0) {
    console.log("修正対象なし");
    return;
  }

  console.log("\nプレビュー（最初の20件）:");
  for (const t of targets.slice(0, 20)) {
    console.log(`  "${t.oldName}" → "${t.newName}"`);
  }

  let fixed = 0;
  for (const t of targets) {
    try {
      await notion.pages.update({
        page_id: t.pageId,
        properties: {
          名前: { title: [{ text: { content: t.newName } }] },
        },
      });
      fixed++;
      if (fixed % 50 === 0) console.log(`  ${fixed}/${targets.length} 件処理済み...`);
    } catch (err: any) {
      console.error(`  error on "${t.oldName}": ${err?.message ?? err}`);
    }
    await sleep(250);
  }
  console.log(`\n✅ 修正完了: ${fixed} 件`);
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
