import "dotenv/config";
import type { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId, getStatusChangeLogDbId } from "./notion.js";
import { notifyMention } from "./notify.js";

// コードが Notion DB に期待しているスキーマ。
// ここがズレた時 = ユーザーが Notion 上で手動でプロパティをいじった時。
// 検知して sync 停止＆通知する。
type ExpectedProp =
  | { type: "title" | "url" | "date" | "rich_text" | "last_edited_time" | "relation" }
  | { type: "select"; required_options: string[] }
  | { type: "multi_select"; required_options: string[] }
  | { type: "number" };

interface ExpectedSchema {
  label: string;
  dbId: string;
  props: Record<string, ExpectedProp>;
}

const COMPANIES_EXPECTED: Omit<ExpectedSchema, "dbId"> = {
  label: "企業リスト",
  props: {
    名前: { type: "title" },
    企業URL: { type: "url" },
    連絡日時: {
      type: "multi_select",
      required_options: ["2026", "2025", "2024", "2023", "2022"],
    },
    営業した媒体: {
      type: "multi_select",
      required_options: ["Wantedly", "Green", "SNS", "直メール/フォーム"],
    },
    ステータス: {
      type: "select",
      required_options: [
        "S:継続中",
        "A：取引あり",
        "B：パートナー契約",
        "C：やりとりあり",
        "D:ご縁がなかった",
        "待機中",
      ],
    },
    最終接触日: { type: "date" },
    "前回ステータス（自動）": { type: "rich_text" },
  },
};

const STATUS_LOG_EXPECTED: Omit<ExpectedSchema, "dbId"> = {
  label: "ステータス変更ログ",
  props: {
    会社名: { type: "title" },
    Before: {
      type: "select",
      required_options: [
        "S:継続中",
        "A：取引あり",
        "B：パートナー契約",
        "C：やりとりあり",
        "D:ご縁がなかった",
        "待機中",
        "(新規)",
      ],
    },
    After: {
      type: "select",
      required_options: [
        "S:継続中",
        "A：取引あり",
        "B：パートナー契約",
        "C：やりとりあり",
        "D:ご縁がなかった",
        "待機中",
      ],
    },
    判定種別: {
      type: "select",
      required_options: ["自動検知", "手動変更", "タイムアウト", "新規追加"],
    },
    判定根拠: { type: "rich_text" },
    変更日時: { type: "date" },
    媒体: {
      type: "multi_select",
      required_options: ["Wantedly", "Green", "SNS", "直メール/フォーム"],
    },
    会社ページ: { type: "relation" },
  },
};

export interface SchemaIssue {
  db: string;
  prop: string;
  kind: "missing" | "type_mismatch" | "option_missing";
  detail: string;
}

export async function checkSchema(notion: Client): Promise<SchemaIssue[]> {
  const targets: ExpectedSchema[] = [
    { ...COMPANIES_EXPECTED, dbId: getCompaniesDbId() },
  ];
  const logId = getStatusChangeLogDbId();
  if (logId) targets.push({ ...STATUS_LOG_EXPECTED, dbId: logId });

  const issues: SchemaIssue[] = [];
  for (const t of targets) {
    const db: any = await notion.databases.retrieve({ database_id: t.dbId });
    const actual = db.properties ?? {};
    for (const [name, expected] of Object.entries(t.props)) {
      const got = actual[name];
      if (!got) {
        issues.push({
          db: t.label,
          prop: name,
          kind: "missing",
          detail: `プロパティ「${name}」が見つからない（リネーム or 削除された可能性）`,
        });
        continue;
      }
      // Notion API は rich_text プロパティの type を "rich_text" で返す。OK。
      if (got.type !== expected.type) {
        issues.push({
          db: t.label,
          prop: name,
          kind: "type_mismatch",
          detail: `期待: ${expected.type} / 実際: ${got.type}`,
        });
        continue;
      }
      if (expected.type === "select" || expected.type === "multi_select") {
        const actualOptions: string[] = (got[expected.type]?.options ?? []).map(
          (o: any) => o.name
        );
        const missing = expected.required_options.filter(
          (o) => !actualOptions.includes(o)
        );
        if (missing.length > 0) {
          issues.push({
            db: t.label,
            prop: name,
            kind: "option_missing",
            detail: `不足オプション: ${missing.join(", ")}`,
          });
        }
      }
    }
  }
  return issues;
}

export function formatIssues(issues: SchemaIssue[]): string {
  if (issues.length === 0) return "✅ スキーマOK";
  return issues
    .map((i) => `❌ [${i.db}] ${i.prop} — ${i.kind}: ${i.detail}`)
    .join("\n");
}

/**
 * sync の頭で呼ぶ用。
 * ズレを検知したら Notion 通知ページにコメント残して、エラーで止める。
 * → GitHub Actions が落ちる → ユーザー or Claude が気づいて修正できる。
 */
export async function assertSchemaOrFail(notion: Client): Promise<void> {
  const issues = await checkSchema(notion);
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
        "Notion 側でプロパティが変更された可能性があります。コード側を追従させるまで sync は停止します。\n\n" +
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
  const issues = await checkSchema(notion);
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
