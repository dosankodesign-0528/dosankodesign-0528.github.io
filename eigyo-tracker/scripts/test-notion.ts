import "dotenv/config";
import { buildNotionClient, fetchAllCompanies, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  console.log(`Fetching companies from DB ${dbId}...`);
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`✅ Total: ${companies.length} companies fetched`);
  console.log("");
  console.log("First 3 entries:");
  for (const c of companies.slice(0, 3)) {
    console.log(
      `  - ${c.name} | url=${c.url ?? "(none)"} | years=[${c.contactYears.join(",")}] | media=[${c.mediaTags.join(",")}]`
    );
  }
  console.log("");
  console.log("Last 3 entries:");
  for (const c of companies.slice(-3)) {
    console.log(
      `  - ${c.name} | url=${c.url ?? "(none)"} | years=[${c.contactYears.join(",")}] | media=[${c.mediaTags.join(",")}]`
    );
  }
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  if (err?.code === "object_not_found") {
    console.error(
      "\nヒント: Integration が「デザイン制作会社」DBに接続されていない可能性。\n" +
        "https://www.notion.so/my-integrations → eigyo-tracker → コンテンツへのアクセス で確認してください。"
    );
  }
  process.exit(1);
});
