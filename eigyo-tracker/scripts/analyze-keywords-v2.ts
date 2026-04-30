import "dotenv/config";
import { Client } from "@notionhq/client";
import { google, gmail_v1 } from "googleapis";
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

const SAMPLE_PER_STATUS = 25;
const LOOKBACK_DAYS = 540;

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
      filter: { property: "ステータス", select: { equals: status } },
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

async function fetchMessageBody(gmail: gmail_v1.Gmail, msgId: string): Promise<string> {
  try {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msgId,
      format: "full",
    });
    const collectText = (part: any): string => {
      let text = "";
      if (part.mimeType === "text/plain" && part.body?.data) {
        text += Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        for (const p of part.parts) text += "\n" + collectText(p);
      }
      return text;
    };
    return collectText(detail.data.payload ?? {}).slice(0, 600);
  } catch {
    return "";
  }
}

async function main() {
  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);

  console.log("\n📚 Wantedly/Green の応募完了・不採用通知メール本文サンプル");
  console.log("━".repeat(60));
  for (const provider of ["wantedly.com", "green-japan.com"]) {
    try {
      const messages = await fetchMessages(gmail, `from:${provider}`, LOOKBACK_DAYS, myEmail);
      console.log(`\n  ▼ ${provider}: ${messages.length} 件取得（先頭10件の件名のみ）`);
      const subjectFreq = new Map<string, number>();
      for (const m of messages) {
        const subj = m.subject.replace(/\s+/g, " ").trim();
        subjectFreq.set(subj, (subjectFreq.get(subj) ?? 0) + 1);
      }
      const sorted = Array.from(subjectFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
      for (const [s, c] of sorted) console.log(`     ${c}× ${s.slice(0, 100)}`);
      const sampleIds = messages
        .filter((m) => /(お祈り|不採用|ご縁|見送り|期待に沿|採用に至り|残念ながら|お見送り)/.test(m.subject + m.snippet))
        .slice(0, 3);
      if (sampleIds.length > 0) {
        console.log(`\n  📩 ${provider} 「不採用系」サンプル本文（最大3通）:`);
        for (const m of sampleIds) {
          const body = await fetchMessageBody(gmail, m.id);
          console.log(`\n     [件名] ${m.subject.slice(0, 80)}`);
          console.log(`     [本文抜粋]`);
          console.log(`     ${body.replace(/\n+/g, " ").slice(0, 400)}`);
        }
      }
    } catch (err: any) {
      console.error(`  error: ${err?.message ?? err}`);
    }
  }

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
    console.log(`サンプル: ${sampled.length} 社`);

    const subjectFreq = new Map<string, number>();
    const replyCount = { withRe: 0, noRe: 0 };
    let domainsWithMail = 0;
    for (const company of sampled) {
      const domain = extractDomain(company.url!);
      if (!domain || ["gmail.com", "yahoo.co.jp", "outlook.com"].includes(domain)) continue;
      try {
        const messages = await fetchMessages(gmail, `(from:${domain} OR to:${domain})`, LOOKBACK_DAYS, myEmail);
        if (messages.length > 0) domainsWithMail++;
        for (const m of messages) {
          const isReply = /^(re:|返信:)/i.test(m.subject.trim());
          if (isReply) replyCount.withRe++; else replyCount.noRe++;
          const subj = m.subject.replace(/^Re:\s*|^Fwd?:\s*|^返信:\s*/gi, "").trim();
          subjectFreq.set(subj, (subjectFreq.get(subj) ?? 0) + 1);
        }
      } catch {}
    }
    console.log(`  メール履歴ありドメイン: ${domainsWithMail}/${sampled.length}`);
    console.log(`  「Re:」付き: ${replyCount.withRe} 件 / 通常: ${replyCount.noRe} 件`);
    console.log(`\n  📧 件名 上位15:`);
    const sorted = Array.from(subjectFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [subj, cnt] of sorted) {
      console.log(`     ${cnt}× ${subj.slice(0, 95)}`);
    }
  }
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
