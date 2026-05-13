import "dotenv/config";
import type { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId, getStatusChangeLogDbId } from "./notion.js";
import { notifyMention } from "./notify.js";
import { resolveSchema, type ResolvedSchema, type MissingItem } from "./schema-resolver.js";
import { selfHealSchema } from "./schema-restorer.js";

// resolver + restorer で吸収しきれなかった崩れを Notion 通知ページに警告コメントとして残す。
// 残るのは主に：型不一致（自動で戻すとデータロス）、title プロパティの欠落など。

function formatMissing(missing: MissingItem[]): string {
  if (missing.length === 0) return "✅ スキーマOK";
  return missing
    .map((m) => {
      if (m.kind === "prop_missing") {
        return `❌ [${m.db}] プロパティ「${m.init.name}」(${m.init.type}) が欠落（再作成失敗 / または title）`;
      }
      if (m.kind === "prop_type_mismatch") {
        return `❌ [${m.db}] 「${m.propertyName}」の型: 期待=${m.expectedType} / 実際=${m.actualType} ← 自動で戻すとデータが消えるため手動対応してください`;
      }
      return `❌ [${m.db}] 「${m.propertyName}」のオプション「${m.init.name}」欠落（追加失敗）`;
    })
    .join("\n");
}

export async function assertSchemaOrFail(notion: Client, schema: ResolvedSchema): Promise<void> {
  if (schema.missing.length === 0) {
    console.log("[schema-check] ✅ OK");
    return;
  }
  const report = formatMissing(schema.missing);
  console.error("[schema-check] 自動復元できないスキーマ崩れ:\n" + report);
  try {
    await notifyMention(notion, {
      title: "⚠️ 営業同期: 自動復元できないスキーマ崩れを検知",
      summary:
        "Notion 側で型変更などが行われ、自動復元できませんでした。Claude に「営業トラッカーを直して」と頼むか、Notion 上で元に戻してください。\n\n" +
        report,
    });
  } catch (e) {
    console.error("[schema-check] 通知失敗", e);
  }
  throw new Error("Notion schema drift (unrecoverable) detected. Aborting sync.");
}

// 単体実行: `npm run check:schema`
async function main() {
  const notion = buildNotionClient();
  const companiesDbId = getCompaniesDbId();
  const statusLogDbId = getStatusChangeLogDbId();

  const initial = await resolveSchema(notion, companiesDbId, statusLogDbId);
  const healed = await selfHealSchema(notion, initial, companiesDbId, statusLogDbId);

  console.log(formatMissing(healed.missing));
  if (healed.missing.length > 0) process.exit(1);
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
