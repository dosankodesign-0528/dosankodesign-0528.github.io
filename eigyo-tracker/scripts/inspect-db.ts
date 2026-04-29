import "dotenv/config";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const db: any = await notion.databases.retrieve({ database_id: dbId });
  console.log(`DB Title: ${db.title?.map((t: any) => t.plain_text).join("") ?? "(no title)"}`);
  console.log("");
  console.log("Properties:");
  for (const [name, info] of Object.entries(db.properties as Record<string, any>)) {
    console.log(`  - "${name}" (${(info as any).type})`);
    if ((info as any).type === "multi_select") {
      const opts = (info as any).multi_select?.options ?? [];
      console.log(`      options: [${opts.map((o: any) => o.name).join(", ")}]`);
    } else if ((info as any).type === "select") {
      const opts = (info as any).select?.options ?? [];
      console.log(`      options: [${opts.map((o: any) => o.name).join(", ")}]`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
