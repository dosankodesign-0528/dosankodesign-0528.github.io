import "dotenv/config";
import type { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId, getStatusChangeLogDbId } from "./notion.js";
import { notifyMention } from "./notify.js";
import { resolveSchema, type ResolvedSchema } from "./schema-resolver.js";

// resolver で「プロパティ名のリネームと新規追加」は吸収済み。
// ここでは「プロパティ削除」「型変更」「select オプション不足」だけを検知する。
// （= コードが書き込む値が拒否されてしまう壊れ方を防ぐ）

const REQUIRED_STATUS_OPTIONS = [
  "S:継続中",
  "A：取引あり",
  "B：パートナー契約",
  "C：やりとりあり",
  "D:ご縁がなかった",
  "待機中",
];
const REQUIRED_MEDIA_OPTIONS = ["Wantedly", "Green", "SNS", "直メール/フォーム"];
const REQUIRED_CONTACT_YEARS: string[] = []; // 年は流動するので必須にしない
const REQUIRED_CATEGORY_OPTIONS = ["自動検知", "手動変更", "タイムアウト", "新規追加"];

interface Expectation {
  db: "企業リスト" | "ステータス変更ログ";
  role: string;
  propertyName: string; // resolver が返した「現在の名前」
  expectedType: string;
  requiredOptions?: string[];
}

export interface SchemaIssue {
  db: string;
  role: string;
  kind: "missing" | "type_mismatch" | "option_missing";
  detail: string;
}

function buildExpectations(schema: ResolvedSchema): Expectation[] {
  const list: Expectation[] = [
    { db: "企業リスト", role: "NAME",         propertyName: schema.companies.NAME,         expectedType: "title" },
    { db: "企業リスト", role: "URL",          propertyName: schema.companies.URL,          expectedType: "url" },
    { db: "企業リスト", role: "CONTACT",      propertyName: schema.companies.CONTACT,      expectedType: "multi_select", requiredOptions: REQUIRED_CONTACT_YEARS },
    { db: "企業リスト", role: "MEDIA",        propertyName: schema.companies.MEDIA,        expectedType: "multi_select", requiredOptions: REQUIRED_MEDIA_OPTIONS },
    { db: "企業リスト", role: "STATUS",       propertyName: schema.companies.STATUS,       expectedType: "select", requiredOptions: REQUIRED_STATUS_OPTIONS },
    { db: "企業リスト", role: "LAST_CONTACT", propertyName: schema.companies.LAST_CONTACT, expectedType: "date" },
    { db: "企業リスト", role: "LAST_KNOWN",   propertyName: schema.companies.LAST_KNOWN,   expectedType: "rich_text" },
  ];
  if (schema.statusLog.TITLE) {
    list.push(
      { db: "ステータス変更ログ", role: "TITLE",       propertyName: schema.statusLog.TITLE,       expectedType: "title" },
      { db: "ステータス変更ログ", role: "BEFORE",      propertyName: schema.statusLog.BEFORE,      expectedType: "select", requiredOptions: [...REQUIRED_STATUS_OPTIONS, "(新規)"] },
      { db: "ステータス変更ログ", role: "AFTER",       propertyName: schema.statusLog.AFTER,       expectedType: "select", requiredOptions: REQUIRED_STATUS_OPTIONS },
      { db: "ステータス変更ログ", role: "CATEGORY",    propertyName: schema.statusLog.CATEGORY,    expectedType: "select", requiredOptions: REQUIRED_CATEGORY_OPTIONS },
      { db: "ステータス変更ログ", role: "EVIDENCE",    propertyName: schema.statusLog.EVIDENCE,    expectedType: "rich_text" },
      { db: "ステータス変更ログ", role: "CHANGED_AT",  propertyName: schema.statusLog.CHANGED_AT,  expectedType: "date" },
      { db: "ステータス変更ログ", role: "MEDIA",       propertyName: schema.statusLog.MEDIA,       expectedType: "multi_select", requiredOptions: REQUIRED_MEDIA_OPTIONS },
      { db: "ステータス変更ログ", role: "COMPANY_REL", propertyName: schema.statusLog.COMPANY_REL, expectedType: "relation" },
    );
  }
  return list;
}

export async function checkSchema(notion: Client, schema: ResolvedSchema): Promise<SchemaIssue[]> {
  const issues: SchemaIssue[] = [];

  // resolver が warning に積んだもの (= 名前 fallback でも見つからない) を missing として扱う
  for (const w of schema.warnings) {
    issues.push({ db: "(resolver)", role: "-", kind: "missing", detail: w });
  }

  // DB ごとにキャッシュ
  const dbCache = new Map<string, any>();
  async function getDb(label: string, dbId: string) {
    const key = `${label}:${dbId}`;
    if (!dbCache.has(key)) {
      dbCache.set(key, await notion.databases.retrieve({ database_id: dbId }));
    }
    return dbCache.get(key);
  }

  const companiesDbId = getCompaniesDbId();
  const logDbId = getStatusChangeLogDbId();

  for (const exp of buildExpectations(schema)) {
    const dbId = exp.db === "企業リスト" ? companiesDbId : logDbId!;
    const db = await getDb(exp.db, dbId);
    const got = db.properties?.[exp.propertyName];
    if (!got) {
      issues.push({
        db: exp.db,
        role: exp.role,
        kind: "missing",
        detail: `役割「${exp.role}」のプロパティ「${exp.propertyName}」が見つからない`,
      });
      continue;
    }
    if (got.type !== exp.expectedType) {
      issues.push({
        db: exp.db,
        role: exp.role,
        kind: "type_mismatch",
        detail: `「${exp.propertyName}」期待型: ${exp.expectedType} / 実際: ${got.type}`,
      });
      continue;
    }
    if (exp.requiredOptions && exp.requiredOptions.length > 0) {
      const actualOptions: string[] = (got[exp.expectedType]?.options ?? []).map((o: any) => o.name);
      const missing = exp.requiredOptions.filter((o) => !actualOptions.includes(o));
      if (missing.length > 0) {
        issues.push({
          db: exp.db,
          role: exp.role,
          kind: "option_missing",
          detail: `「${exp.propertyName}」の不足オプション: ${missing.join(", ")}`,
        });
      }
    }
  }
  return issues;
}

export function formatIssues(issues: SchemaIssue[]): string {
  if (issues.length === 0) return "✅ スキーマOK";
  return issues
    .map((i) => `❌ [${i.db}] ${i.role} — ${i.kind}: ${i.detail}`)
    .join("\n");
}

/**
 * sync の頭で呼ぶ用。resolver で吸収できなかった崩れだけを通知＆停止する。
 */
export async function assertSchemaOrFail(notion: Client, schema: ResolvedSchema): Promise<void> {
  const issues = await checkSchema(notion, schema);
  if (issues.length === 0) {
    console.log("[schema-check] ✅ OK");
    return;
  }
  const report = formatIssues(issues);
  console.error("[schema-check] スキーマ崩れを検知:\n" + report);
  try {
    await notifyMention(notion, {
      title: "⚠️ 営業同期: Notion スキーマ崩れを検知",
      summary:
        "Notion 側でプロパティが削除/型変更されました。コード側を追従させるまで sync は停止します。\n\n" +
        report,
    });
  } catch (e) {
    console.error("[schema-check] 通知失敗", e);
  }
  throw new Error("Notion schema drift detected. Aborting sync.");
}

// 単体実行: `npm run check:schema`
async function main() {
  const notion = buildNotionClient();
  const schema = await resolveSchema(notion, getCompaniesDbId(), getStatusChangeLogDbId());
  const issues = await checkSchema(notion, schema);
  console.log(formatIssues(issues));
  if (issues.length > 0) process.exit(1);
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("schema-check.ts");
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
