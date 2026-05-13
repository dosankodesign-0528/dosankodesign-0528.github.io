/**
 * C ステータスの会社を監査するスクリプト：
 *   各 C 状態の会社について、最近のメール本文を新しい厳格判定で再評価し、
 *   「実は auto-reply 起因の誤検知では？」「実は REJECTION では？」を炙り出す。
 *
 * カテゴリ:
 *   🟢 OK              - 明確な商談/契約/招待シグナルあり
 *   🟡 auto-reply のみ - 直近メールが全部 auto-reply（C 誤検知の可能性）
 *   🔴 REJECTION 検知  - 拒絶メールあり（D に降格すべき可能性）
 *   ⚪ メールなし       - 直近期間に該当ドメインのメールなし（評価不可）
 *
 * 結果は Notion ページとして「ノート」直下に作成 + console にもサマリ出力。
 *
 * 実行: workflow_dispatch (audit-c-status.yml)
 *   入力: LOOKBACK_DAYS=14 (default)
 */
import "dotenv/config";
import { Client } from "@notionhq/client";
import {
  buildGmailClient,
  fetchMessages,
  getMyEmail,
} from "./gmail.js";
import {
  buildNotionClient,
  fetchAllCompanies,
  getCompaniesDbId,
  getStatusChangeLogDbId,
} from "./notion.js";
import { resolveSchema } from "./schema-resolver.js";
import { detectStatusFromMessage, STATUS } from "./status.js";
import type { CompanyRecord, RawMessage } from "./types.js";

const NOTE_PARENT_PAGE_ID = "62b6833ac3c8401b895afb99c8260fb2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Category = "OK" | "AUTO_REPLY_ONLY" | "REJECTION" | "NO_EMAIL";

interface AuditResult {
  company: CompanyRecord;
  category: Category;
  detail: string;
  emails: Array<{ subject: string; date: string; detection: string }>;
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function auditCompany(
  gmail: any,
  myEmail: string,
  company: CompanyRecord,
  lookbackDays: number
): Promise<AuditResult> {
  const domain = extractDomain(company.url);
  if (!domain) {
    return {
      company,
      category: "NO_EMAIL",
      detail: "URL から ドメイン抽出できず",
      emails: [],
    };
  }
  let messages: RawMessage[] = [];
  try {
    messages = await fetchMessages(gmail, `from:${domain}`, lookbackDays, myEmail, {
      withBody: true,
    });
  } catch (err: any) {
    return {
      company,
      category: "NO_EMAIL",
      detail: `Gmail取得エラー: ${err?.message ?? err}`,
      emails: [],
    };
  }
  if (messages.length === 0) {
    return {
      company,
      category: "NO_EMAIL",
      detail: `直近${lookbackDays}日間 from:${domain} のメールなし`,
      emails: [],
    };
  }

  const emailDetails: AuditResult["emails"] = [];
  let hasGoodSignal = false;
  let hasRejection = false;
  let allAutoReply = true;

  for (const msg of messages) {
    const detection = detectStatusFromMessage(msg);
    const detectStr = detection
      ? `${detection.signal}: ${detection.matchedKeyword}`
      : "(検知なし or auto-reply)";
    emailDetails.push({
      subject: msg.subject,
      date: msg.date.toISOString().slice(0, 10),
      detection: detectStr,
    });
    if (detection) {
      allAutoReply = false;
      if (detection.signal === "REJECTION") hasRejection = true;
      if (
        detection.signal === "MEETING" ||
        detection.signal === "CONTRACT" ||
        detection.signal === "INVITE" ||
        detection.signal === "REPLY"
      ) {
        hasGoodSignal = true;
      }
    }
  }

  if (hasRejection) {
    return {
      company,
      category: "REJECTION",
      detail: "直近メールに拒絶系キーワードあり → D 検討",
      emails: emailDetails,
    };
  }
  if (hasGoodSignal) {
    return {
      company,
      category: "OK",
      detail: "明確な商談/契約/招待シグナルあり",
      emails: emailDetails,
    };
  }
  if (allAutoReply) {
    return {
      company,
      category: "AUTO_REPLY_ONLY",
      detail: "直近メールが全部 auto-reply 系 → C 誤検知の可能性",
      emails: emailDetails,
    };
  }
  return {
    company,
    category: "NO_EMAIL",
    detail: "メールはあるが明確なシグナルなし",
    emails: emailDetails,
  };
}

function categoryEmoji(c: Category): string {
  return { OK: "🟢", AUTO_REPLY_ONLY: "🟡", REJECTION: "🔴", NO_EMAIL: "⚪" }[c];
}

async function createReportPage(
  notion: Client,
  results: AuditResult[],
  lookbackDays: number
): Promise<string> {
  const groups: Record<Category, AuditResult[]> = {
    OK: [],
    AUTO_REPLY_ONLY: [],
    REJECTION: [],
    NO_EMAIL: [],
  };
  for (const r of results) groups[r.category].push(r);

  const dateStr = new Date().toISOString().slice(0, 10);
  const blocks: any[] = [
    {
      object: "block",
      type: "callout",
      callout: {
        icon: { type: "emoji", emoji: "🔍" },
        color: "blue_background",
        rich_text: [
          {
            type: "text",
            text: {
              content: `C ステータス会社 ${results.length} 社を直近 ${lookbackDays} 日間のメールで監査しました。要対応のものは 🟡 と 🔴 セクションを確認してください。`,
            },
          },
        ],
      },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `🟢 OK: ${groups.OK.length} 社 / 🟡 auto-reply のみ: ${groups.AUTO_REPLY_ONLY.length} 社 / 🔴 REJECTION 検知: ${groups.REJECTION.length} 社 / ⚪ メールなし: ${groups.NO_EMAIL.length} 社`,
            },
            annotations: { bold: true },
          },
        ],
      },
    },
    { object: "block", type: "divider", divider: {} },
  ];

  // 重要度順: REJECTION → AUTO_REPLY_ONLY → OK → NO_EMAIL
  const order: Category[] = ["REJECTION", "AUTO_REPLY_ONLY", "OK", "NO_EMAIL"];
  for (const cat of order) {
    const items = groups[cat];
    if (items.length === 0) continue;
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          { type: "text", text: { content: `${categoryEmoji(cat)} ${cat} (${items.length} 社)` } },
        ],
      },
    });
    for (const r of items.slice(0, 50)) {
      // 各会社のヘッダ
      blocks.push({
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [
            {
              type: "mention",
              mention: { type: "page", page: { id: r.company.pageId } },
            },
            {
              type: "text",
              text: { content: ` — ${r.detail}` },
              annotations: { color: "gray" },
            },
          ],
          children: r.emails.length > 0
            ? r.emails.slice(0, 5).map((e) => ({
                object: "block",
                type: "bulleted_list_item",
                bulleted_list_item: {
                  rich_text: [
                    { type: "text", text: { content: `${e.date} ` }, annotations: { color: "gray" } },
                    { type: "text", text: { content: e.subject } },
                    { type: "text", text: { content: ` → ${e.detection}` }, annotations: { color: "blue" } },
                  ],
                },
              }))
            : [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ type: "text", text: { content: "(該当メールなし)" }, annotations: { color: "gray" } }],
                  },
                },
              ],
        },
      });
    }
    if (items.length > 50) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `…他 ${items.length - 50} 社（コンソールログを参照）` }, annotations: { color: "gray" } }],
        },
      });
    }
  }

  const created: any = await notion.pages.create({
    parent: { page_id: NOTE_PARENT_PAGE_ID },
    properties: {
      title: { title: [{ text: { content: `🔍 C ステータス監査レポート (${dateStr})` } }] },
    },
    icon: { type: "emoji", emoji: "🔍" },
    children: blocks.slice(0, 90),
  });
  // 91個以降は append
  for (let i = 90; i < blocks.length; i += 90) {
    await notion.blocks.children.append({
      block_id: created.id,
      children: blocks.slice(i, i + 90),
    });
  }
  return created.url;
}

async function main() {
  const lookbackDays = Number(process.env.LOOKBACK_DAYS ?? "14");

  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);
  console.log(`[audit] mailbox: ${myEmail}`);

  const schema = await resolveSchema(notion, dbId, getStatusChangeLogDbId());
  const all = await fetchAllCompanies(notion, dbId, schema.companies);
  const targets = all.filter((c) => c.status === STATUS.C);
  console.log(`[audit] C ステータス会社: ${targets.length} 社`);

  const results: AuditResult[] = [];
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i]!;
    const r = await auditCompany(gmail, myEmail, c, lookbackDays);
    results.push(r);
    const emoji = categoryEmoji(r.category);
    console.log(`  ${emoji} [${i + 1}/${targets.length}] ${c.name}: ${r.detail}`);
    // Gmail API rate limit 対策
    await sleep(150);
  }

  const counts: Record<Category, number> = { OK: 0, AUTO_REPLY_ONLY: 0, REJECTION: 0, NO_EMAIL: 0 };
  for (const r of results) counts[r.category]++;
  console.log(
    `\n[audit] 集計: 🟢${counts.OK} / 🟡${counts.AUTO_REPLY_ONLY} / 🔴${counts.REJECTION} / ⚪${counts.NO_EMAIL}`
  );

  const url = await createReportPage(notion, results, lookbackDays);
  console.log(`[audit] ✅ レポート作成: ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
