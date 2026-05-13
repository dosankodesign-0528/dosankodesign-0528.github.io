import type { Client } from "@notionhq/client";
import { resolveSchema, type MissingItem, type ResolvedSchema } from "./schema-resolver.js";
import { notifyMention } from "./notify.js";

// resolver が見つけた「欠落」を Notion API で自動再作成する。
// 型不一致は自動で戻すとデータが消えるので、ここでは扱わない（schema-check が停止させる）。

export interface RestoreReport {
  restored: string[];
  unrecoverable: MissingItem[];
}

export async function restoreMissing(
  notion: Client,
  schema: ResolvedSchema,
  companiesDbId: string,
  statusLogDbId: string | null
): Promise<RestoreReport> {
  const restored: string[] = [];
  const unrecoverable: MissingItem[] = [];

  // 1) prop_missing → databases.update でプロパティ再作成
  for (const m of schema.missing) {
    if (m.kind !== "prop_missing") continue;
    const dbId = m.db === "companies" ? companiesDbId : statusLogDbId;
    if (!dbId) { unrecoverable.push(m); continue; }
    try {
      const schemaPatch: any = {};
      const propConfig: any = { name: m.init.name };
      switch (m.init.type) {
        case "title":
          // title は削除されることはほぼ無い & Notion API では title は新規追加不可
          unrecoverable.push(m);
          continue;
        case "url":
          propConfig.url = {};
          break;
        case "date":
          propConfig.date = {};
          break;
        case "rich_text":
          propConfig.rich_text = {};
          break;
        case "checkbox":
          propConfig.checkbox = {};
          break;
        case "relation":
          // relation は target が必要。companies DB 向け固定。
          propConfig.relation = { database_id: companiesDbId, type: "single_property", single_property: {} };
          break;
        case "select":
          propConfig.select = {
            options: m.init.options
              ? Object.values(m.init.options).map((name) => ({ name: name as string }))
              : [],
          };
          break;
        case "multi_select":
          propConfig.multi_select = {
            options: m.init.options
              ? Object.values(m.init.options).map((name) => ({ name: name as string }))
              : [],
          };
          break;
        default:
          unrecoverable.push(m);
          continue;
      }
      schemaPatch[m.init.name] = propConfig;
      await notion.databases.update({ database_id: dbId, properties: schemaPatch } as any);
      restored.push(`[${m.db}] プロパティ「${m.init.name}」(${m.init.type}) を再作成`);
    } catch (err: any) {
      console.error(`[restorer] prop_missing 復元失敗: ${err?.message ?? err}`);
      unrecoverable.push(m);
    }
  }

  // 2) option_missing → 該当プロパティの options 配列に追記
  // 同じプロパティへの追記をまとめて 1 リクエストにする
  const optionPatches = new Map<string, { db: "companies" | "statusLog"; propertyName: string; propertyType: "select" | "multi_select"; addNames: string[] }>();
  for (const m of schema.missing) {
    if (m.kind !== "option_missing") continue;
    const key = `${m.db}::${m.propertyName}`;
    const entry = optionPatches.get(key) ?? {
      db: m.db,
      propertyName: m.propertyName,
      propertyType: m.propertyType,
      addNames: [],
    };
    entry.addNames.push(m.init.name);
    optionPatches.set(key, entry);
  }

  for (const patch of optionPatches.values()) {
    const dbId = patch.db === "companies" ? companiesDbId : statusLogDbId;
    if (!dbId) { continue; }
    try {
      // 現在の options に追加分をマージ（既存名は維持して新規だけ append）
      const db: any = await notion.databases.retrieve({ database_id: dbId });
      const propInfo = db.properties?.[patch.propertyName];
      if (!propInfo || propInfo.type !== patch.propertyType) {
        // resolver の認識と乖離（同時編集など）→ スキップ
        continue;
      }
      const existing = (propInfo[patch.propertyType]?.options ?? []) as Array<{ name: string; color?: string }>;
      const existingNames = new Set(existing.map((o) => o.name));
      const merged = [...existing];
      for (const name of patch.addNames) {
        if (!existingNames.has(name)) merged.push({ name });
      }
      await notion.databases.update({
        database_id: dbId,
        properties: {
          [patch.propertyName]: {
            [patch.propertyType]: { options: merged },
          },
        },
      } as any);
      restored.push(`[${patch.db}] 「${patch.propertyName}」にオプション追加: ${patch.addNames.join(", ")}`);
    } catch (err: any) {
      console.error(`[restorer] option_missing 復元失敗: ${err?.message ?? err}`);
      for (const name of patch.addNames) {
        unrecoverable.push({
          kind: "option_missing",
          db: patch.db,
          role: "(unknown)",
          optionRole: "(unknown)",
          init: { name },
          propertyName: patch.propertyName,
          propertyType: patch.propertyType,
        });
      }
    }
  }

  // 3) prop_type_mismatch → 自動復元しない（データロスのため）。残す。
  for (const m of schema.missing) {
    if (m.kind === "prop_type_mismatch") unrecoverable.push(m);
  }

  return { restored, unrecoverable };
}

/**
 * sync の頭で呼ぶ。欠落を見つけたら自動復元し、復元できなかったものを通知＆停止する。
 * 復元できたら新しいスキーマで resolveSchema をもう一度走らせて、最新の解決結果を返す。
 */
export async function selfHealSchema(
  notion: Client,
  initialSchema: ResolvedSchema,
  companiesDbId: string,
  statusLogDbId: string | null
): Promise<ResolvedSchema> {
  if (initialSchema.missing.length === 0) return initialSchema;

  console.log(`[restorer] 欠落 ${initialSchema.missing.length} 件を自動復元中...`);
  const report = await restoreMissing(notion, initialSchema, companiesDbId, statusLogDbId);

  for (const line of report.restored) console.log("  ✅ " + line);
  for (const m of report.unrecoverable) console.warn("  ❌ 未復元: " + JSON.stringify(m));

  if (report.restored.length > 0) {
    try {
      await notifyMention(notion, {
        title: `🔧 営業同期: Notion スキーマを自動復元 (${report.restored.length} 件)`,
        summary:
          "ヒデさんが Notion 上で削除/変更したプロパティ・オプションを自動で元に戻しました。\n" +
          "意図的な変更だった場合は、コード側のスキーマ定義 (src/schema-resolver.ts) を更新してから再 sync してください。\n\n" +
          report.restored.map((l) => "✅ " + l).join("\n"),
      });
    } catch (e) {
      console.error("[restorer] 通知失敗", e);
    }
  }

  // 復元後にもう一度 resolve し直して最新の解決結果を取得
  const reResolved = await resolveSchema(notion, companiesDbId, statusLogDbId);

  // 未復元のもの (主に型不一致) は schema-check で停止する判断に任せる
  reResolved.missing = report.unrecoverable;
  return reResolved;
}
