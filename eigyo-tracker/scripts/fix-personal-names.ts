import "dotenv/config";
import { buildNotionClient, fetchAllCompanies, getCompaniesDbId } from "../src/notion.js";
import { buildGmailClient, fetchMessages, getMyEmail } from "../src/gmail.js";
import { extractCompanyName, isPersonalName } from "../src/classify.js";
import type { CompanyRecord } from "../src/types.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractHost(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

const NOISE_NAMES = new Set(["gmail", "Gmail", "Wantedly", "wantedly"]);

function shouldFix(record: CompanyRecord): boolean {
  if (!record.url) return false;
  if (isPersonalName(record.name)) return true;
  if (NOISE_NAMES.has(record.name)) return true;
  if (record.name.includes("|")) return true;
  if (record.name.length > 40) return true;
  return false;
}

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);

  console.log("=== 全企業取得 ===");
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`Total: ${companies.length}`);

  const targets = companies.filter(shouldFix);
  console.log(`修正候補: ${targets.length} 件`);
  if (targets.length === 0) {
    console.log("修正対象なし");
    return;
  }

  let fixed = 0;
  let skipped = 0;
  for (const target of targets) {
    const domain = extractHost(target.url!);
    if (!domain) {
      skipped++;
      continue;
    }
    let messages;
    try {
      messages = await fetchMessages(gmail, `from:${domain} OR to:${domain}`, 90, myEmail);
    } catch {
      skipped++;
      continue;
    }
    let bestName: string | null = null;
    for (const m of messages) {
      const name = extractCompanyName(m, domain);
      if (name && !isPersonalName(name) && !NOISE_NAMES.has(name) && name.length <= 40) {
        bestName = name;
        break;
      }
    }
    if (!bestName) {
      const sld = domain.split(".")[0];
      if (sld && sld !== "gmail") bestName = sld;
    }
    if (!bestName || bestName === target.name) {
      skipped++;
      continue;
    }
    try {
      await notion.pages.update({
        page_id: target.pageId,
        properties: {
          名前: { title: [{ text: { content: bestName } }] },
        },
      });
      fixed++;
      console.log(`  ✏️  "${target.name}" → "${bestName}"  (${domain})`);
    } catch (err: any) {
      console.error(`  error: ${target.name}: ${err?.message ?? err}`);
      skipped++;
    }
    await sleep(300);
  }
  console.log(`\n✅ Fixed: ${fixed}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
