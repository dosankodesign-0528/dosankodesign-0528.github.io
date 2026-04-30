import "dotenv/config";
import { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId } from "../src/notion.js";
import { buildGmailClient, fetchMessages, getMyEmail } from "../src/gmail.js";

const STATUSES = [
  "S:継続中",
  "A：取引あり",
  "B：パートナー契約",
  "C：やりとりあり",
  "D:ご縁がなかった",
  "待機中",
];

const SAMPLE_PER_STATUS = 8;
const LOOKBACK_DAYS = 365;

interface CompanyEntry {
  pageId: string;
  name: string;
  url: string | null;
  status: string;
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function fetchCompaniesByStatus(
  notion: Client,
  dbId: string,
  status: string
): Promise<CompanyEntry[]> {
  const results: CompanyEntry[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: "ステータス",
        select: { equals: status },
      },
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of res.results) {
      const props = p.properties ?? {};
      const titleProp = props["名前"];
      const name = titleProp?.type === "title"
        ? (titleProp.title ?? []).map((t: any) => t.plain_text).join("")
        : "";
      const urlProp = props["企業URL"];
      const url = urlProp?.type === "url" ? urlProp.url ?? null : null;
      results.push({ pageId: p.id, name, url, status });
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return results;
}

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);

  for (const status of STATUSES) {
    console.log(`\n${"━".repeat(60)}`);
    console.log(`📊 ステータス: ${status}`);
    console.log("━".repeat(60));

    const companies = await fetchCompaniesByStatus(notion, dbId, status);
    console.log(`総企業数: ${companies.length}`);

    const sampled = companies
      .filter((c) => c.url)
      .sort(() => Math.random() - 0.5)
      .slice(0, SAMPLE_PER_STATUS);

    console.log(`サンプル: ${sampled.length} 社\n`);

    const subjectCounts = new Map<string, number>();
    for (const company of sampled) {
      const domain = extractDomain(company.url!);
      if (!domain || domain === "gmail.com" || domain === "wantedly.com") continue;
      try {
        const messages = await fetchMessages(
          gmail,
          `(from:${domain} OR to:${domain})`,
          LOOKBACK_DAYS,
          myEmail
        );
        if (messages.length > 0) {
          console.log(`  📩 ${company.name} (${domain}) - ${messages.length} 件`);
          for (const m of messages.slice(0, 3)) {
            console.log(`     • ${m.subject.slice(0, 70)}`);
          }
          for (const m of messages) {
            const subj = m.subject.replace(/^Re:\s*|^Fwd?:\s*/gi, "").trim();
            subjectCounts.set(subj, (subjectCounts.get(subj) ?? 0) + 1);
          }
        }
      } catch {}
    }

    console.log(`\n  💡 ${status} のメール件名 上位10:`);
    const sorted = Array.from(subjectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [subj, cnt] of sorted) {
      console.log(`     ${cnt}× ${subj.slice(0, 80)}`);
    }
  }
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
