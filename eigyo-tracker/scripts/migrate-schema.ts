import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function batchRun<T>(items: T[], fn: (item: T) => Promise<void>, batchSize: number, delayMs: number) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
    if (i + batchSize < items.length) await sleep(delayMs);
  }
}

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();

  console.log("=== Step 1: 全レコード取得 ===");
  const pages: Array<{ id: string; mediaValue: string | null; name: string }> = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      const props = page.properties;
      const mediaProp = props["媒体"];
      const mediaValue = mediaProp?.type === "select" ? mediaProp.select?.name ?? null : null;
      const nameProp = props["名前"];
      const name = (nameProp?.title ?? []).map((t: any) => t.plain_text).join("");
      pages.push({ id: page.id, mediaValue, name });
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  console.log(`  Total: ${pages.length} pages`);
  const withMedia = pages.filter((p) => p.mediaValue);
  console.log(`  Pages with media value: ${withMedia.length}`);

  console.log("\n=== Step 2: 「備考」(rich_text) カラム追加 ===");
  await notion.databases.update({
    database_id: dbId,
    properties: {
      備考: { rich_text: {} },
    },
  });
  console.log("  ✅ 備考カラム追加完了");

  console.log("\n=== Step 3: 各ページの「備考」に旧「媒体」値を転記 ===");
  let written = 0;
  await batchRun(
    withMedia,
    async (page) => {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          備考: { rich_text: [{ text: { content: page.mediaValue! } }] },
        },
      });
      written++;
      if (written % 50 === 0) console.log(`  ${written}/${withMedia.length} pages updated...`);
    },
    5,
    1000
  );
  console.log(`  ✅ ${written} pages updated`);

  console.log("\n=== Step 4: 旧「媒体」(select) カラム削除 ===");
  await notion.databases.update({
    database_id: dbId,
    properties: {
      媒体: null as any,
    },
  });
  console.log("  ✅ 旧媒体カラム削除完了");

  console.log("\n=== Step 5: 「媒体」(multi_select) カラム新規追加 ===");
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
  console.log("  ✅ 新媒体カラム作成完了");

  console.log("\n🎉 復旧完了！");
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
