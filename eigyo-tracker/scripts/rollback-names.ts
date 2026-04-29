import "dotenv/config";
import { buildNotionClient, fetchAllCompanies, getCompaniesDbId } from "../src/notion.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROLLBACK: Array<{ domain: string; original: string }> = [
  { domain: "studio-spoon.co.jp", original: "STUDIO SPOON" },
  { domain: "monkey-drive.com", original: "MONKEY DRIVE" },
  { domain: "nico-d.net", original: " NICO DESIGN" },
  { domain: "brik.co.jp", original: "製作所" },
  { domain: "therethere.tokyo", original: "There There" },
  { domain: "gentosha.co.jp", original: "幻冬舎" },
  { domain: "dododesign.jp", original: "DODO DESIGN" },
  { domain: "allrightgraphics.com", original: "ALLRIGHT GRAPHICS" },
  { domain: "aizawa-office.com", original: "相澤事務所" },
  { domain: "end-tokyo.com", original: "THE END" },
  { domain: "shibusawadesign.com", original: "渋沢企画" },
  { domain: "kotohogidesign.com", original: "KOTOHOGI DESIGN" },
  { domain: "markledesign.com", original: "MARKLE DESIGN" },
  { domain: "arts-japan.info", original: "Arts Japan" },
  { domain: "pfq.jp", original: "ピラミッドフィルム クアドラ" },
  { domain: "aymid.jp", original: "AYUMI BIONICS" },
  { domain: "super-studio.jp", original: "SUPER STUDIO" },
  { domain: "green-carbon.co.jp", original: "Green Carbon" },
  { domain: "edufuture.co.jp", original: "Edv Future" },
  { domain: "makeculture.jp", original: "Make Culture" },
  { domain: "souei.jp", original: "創英" },
  { domain: "postcredit.co.jp", original: "POST CREDIT" },
  { domain: "unit-base.com", original: "UNIT BASE" },
  { domain: "right-b.com", original: "Right Brothers" },
  { domain: "privtech.co.jp", original: "Priv Tech" },
  { domain: "fabercompany.co.jp", original: "Faber Company" },
  { domain: "xaiondata.co.jp", original: "XAION DATA" },
  { domain: "colorfulpalette.co.jp", original: "Colorful Palette" },
  { domain: "kamakura-net.co.jp", original: "鎌倉新書" },
  { domain: "kuroholdgs.jp", original: "KURO HOLDINGS" },
  { domain: "suke-dachi.jp", original: "助太刀" },
  { domain: "baby-job.co.jp", original: "BABY JOB" },
  { domain: "tenchijin.co.jp", original: "天地人" },
  { domain: "leaner.co.jp", original: "Leaner Technologies" },
  { domain: "robotpayment.co.jp", original: "ROBOT PAYMENT" },
  { domain: "who-i.co.jp", original: "Who I" },
  { domain: "move-emotions.co.jp", original: "Move Emotions" },
  { domain: "nissenad.co.jp", original: "日宣" },
  { domain: "kyosen.co.jp", original: "協同宣伝" },
];

function extractHost(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  console.log("=== 全企業取得 ===");
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`Total: ${companies.length}`);

  const map = new Map<string, typeof companies[0]>();
  for (const c of companies) {
    if (!c.url) continue;
    const host = extractHost(c.url);
    if (host) map.set(host, c);
  }

  let restored = 0;
  let notFound = 0;
  for (const item of ROLLBACK) {
    const company = map.get(item.domain);
    if (!company) {
      console.log(`  not found: ${item.domain}`);
      notFound++;
      continue;
    }
    try {
      await notion.pages.update({
        page_id: company.pageId,
        properties: {
          名前: { title: [{ text: { content: item.original } }] },
        },
      });
      restored++;
      console.log(`  ↩️  "${company.name}" → "${item.original}"  (${item.domain})`);
    } catch (err: any) {
      console.error(`  error: ${err?.message ?? err}`);
    }
    await sleep(300);
  }
  console.log(`\n✅ Restored: ${restored}, Not Found: ${notFound}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
