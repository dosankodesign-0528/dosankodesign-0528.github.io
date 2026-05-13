import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "@notionhq/client";

// 「役割」→ Notion プロパティの対応。
// id は Notion 内部 ID（rename しても変わらない）。
// currentName はキャッシュ時点での名前。次回 sync 時、id で逆引きできれば最新名で上書きされる。

// 役割キー一覧（コード側からはこの key だけで参照する）
export const COMPANIES_ROLES = [
  "NAME",
  "URL",
  "CONTACT",
  "MEDIA",
  "STATUS",
  "LAST_CONTACT",
  "LAST_KNOWN",
] as const;
export type CompaniesRole = (typeof COMPANIES_ROLES)[number];

export const STATUS_LOG_ROLES = [
  "TITLE",
  "BEFORE",
  "AFTER",
  "CATEGORY",
  "EVIDENCE",
  "CHANGED_AT",
  "MEDIA",
  "COMPANY_REL",
] as const;
export type StatusLogRole = (typeof STATUS_LOG_ROLES)[number];

interface RoleBinding {
  id: string | null;
  currentName: string; // 「真実」の名前。キャッシュより Notion 側を優先して都度更新
  type: string;
}

interface DbBindings<R extends string> {
  dbId: string;
  props: Record<R, RoleBinding>;
}

interface SchemaCache {
  schemaVersion: 1;
  lastResolvedAt: string;
  companies: DbBindings<CompaniesRole>;
  statusLog: DbBindings<StatusLogRole>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CACHE_PATH = join(__dirname, "..", "notion-schema-cache.json");

// 名前 fallback の初期値。キャッシュが空 or 名前変更直後 (id 不一致) の時に使う。
const COMPANIES_INITIAL_NAMES: Record<CompaniesRole, { name: string; type: string }> = {
  NAME: { name: "名前", type: "title" },
  URL: { name: "企業URL", type: "url" },
  CONTACT: { name: "連絡日時", type: "multi_select" },
  MEDIA: { name: "営業した媒体", type: "multi_select" },
  STATUS: { name: "ステータス", type: "select" },
  LAST_CONTACT: { name: "最終接触日", type: "date" },
  LAST_KNOWN: { name: "前回ステータス（自動）", type: "rich_text" },
};

const STATUS_LOG_INITIAL_NAMES: Record<StatusLogRole, { name: string; type: string }> = {
  TITLE: { name: "会社名", type: "title" },
  BEFORE: { name: "Before", type: "select" },
  AFTER: { name: "After", type: "select" },
  CATEGORY: { name: "判定種別", type: "select" },
  EVIDENCE: { name: "判定根拠", type: "rich_text" },
  CHANGED_AT: { name: "変更日時", type: "date" },
  MEDIA: { name: "媒体", type: "multi_select" },
  COMPANY_REL: { name: "会社ページ", type: "relation" },
};

export interface ResolvedSchema {
  companies: Record<CompaniesRole, string>;
  statusLog: Record<StatusLogRole, string>;
  cacheChanged: boolean; // 終了時に commit するための flag
  warnings: string[];
}

function loadCache(): SchemaCache | null {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch (e) {
    console.warn(`[schema-resolver] cache parse failed: ${(e as Error).message}`);
    return null;
  }
}

function saveCache(cache: SchemaCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

function emptyBindings<R extends string>(
  dbId: string,
  initial: Record<R, { name: string; type: string }>
): DbBindings<R> {
  const props = {} as Record<R, RoleBinding>;
  for (const [role, v] of Object.entries(initial) as [R, { name: string; type: string }][]) {
    props[role] = { id: null, currentName: v.name, type: v.type };
  }
  return { dbId, props };
}

/**
 * 1 つの DB について、役割→現在名のマップを返す。
 * ID で逆引きできれば最新名で resolve。できなければ「キャッシュ済み currentName」で名前一致を試す。
 * 何も見つからなければ「初期値の名前」で再試行。それでもダメなら warning に積む。
 */
function resolveOne<R extends string>(
  label: string,
  bindings: DbBindings<R>,
  initial: Record<R, { name: string; type: string }>,
  actualProps: Record<string, { id: string; type: string }>,
  warnings: string[]
): { resolved: Record<R, string>; bindingsChanged: boolean } {
  let bindingsChanged = false;
  const resolved = {} as Record<R, string>;

  // actualProps を id でも引けるようにする
  const byId = new Map<string, { name: string; type: string }>();
  for (const [name, p] of Object.entries(actualProps)) {
    byId.set(p.id, { name, type: p.type });
  }

  for (const role of Object.keys(initial) as R[]) {
    const binding = bindings.props[role];
    const init = initial[role];

    // 1) ID で逆引き
    if (binding?.id) {
      const hit = byId.get(binding.id);
      if (hit) {
        if (hit.name !== binding.currentName || hit.type !== binding.type) {
          binding.currentName = hit.name;
          binding.type = hit.type;
          bindingsChanged = true;
        }
        resolved[role] = hit.name;
        continue;
      }
    }

    // 2) キャッシュ済みの「currentName」で名前一致
    const byCachedName = actualProps[binding?.currentName ?? ""];
    if (byCachedName) {
      // 新しい ID を発見 → cache に焼く
      if (binding.id !== byCachedName.id) {
        binding.id = byCachedName.id;
        bindingsChanged = true;
      }
      if (binding.type !== byCachedName.type) {
        binding.type = byCachedName.type;
        bindingsChanged = true;
      }
      resolved[role] = binding.currentName;
      continue;
    }

    // 3) 初期値の名前で再試行（初回起動・キャッシュ空など）
    const byInitName = actualProps[init.name];
    if (byInitName) {
      binding.id = byInitName.id;
      binding.currentName = init.name;
      binding.type = byInitName.type;
      bindingsChanged = true;
      resolved[role] = init.name;
      continue;
    }

    // 4) どれもダメ
    warnings.push(
      `[${label}] 役割「${role}」のプロパティが見つからない。期待名: ${init.name} (型: ${init.type})`
    );
    resolved[role] = binding?.currentName ?? init.name;
  }

  return { resolved, bindingsChanged };
}

/**
 * 起動時に呼ぶ。Notion DB の現状を取得 → 役割→現在名マップ + キャッシュ更新差分を返す。
 */
export async function resolveSchema(
  notion: Client,
  companiesDbId: string,
  statusLogDbId: string | null
): Promise<ResolvedSchema> {
  const cache: SchemaCache =
    loadCache() ?? {
      schemaVersion: 1,
      lastResolvedAt: new Date(0).toISOString(),
      companies: emptyBindings<CompaniesRole>(companiesDbId, COMPANIES_INITIAL_NAMES),
      statusLog: emptyBindings<StatusLogRole>(
        statusLogDbId ?? "",
        STATUS_LOG_INITIAL_NAMES
      ),
    };

  // dbId 食い違い検知 (env を切り替えた場合)
  if (cache.companies.dbId !== companiesDbId) {
    cache.companies = emptyBindings<CompaniesRole>(companiesDbId, COMPANIES_INITIAL_NAMES);
  }
  if (statusLogDbId && cache.statusLog.dbId !== statusLogDbId) {
    cache.statusLog = emptyBindings<StatusLogRole>(statusLogDbId, STATUS_LOG_INITIAL_NAMES);
  }

  const warnings: string[] = [];
  let cacheChanged = false;

  // companies
  const companiesDb: any = await notion.databases.retrieve({ database_id: companiesDbId });
  const companiesActual = simplifyProps(companiesDb.properties);
  const c = resolveOne(
    "企業リスト",
    cache.companies,
    COMPANIES_INITIAL_NAMES,
    companiesActual,
    warnings
  );
  cacheChanged = cacheChanged || c.bindingsChanged;

  // status log
  let resolvedLog: Record<StatusLogRole, string>;
  if (statusLogDbId) {
    const logDb: any = await notion.databases.retrieve({ database_id: statusLogDbId });
    const logActual = simplifyProps(logDb.properties);
    const r = resolveOne(
      "ステータス変更ログ",
      cache.statusLog,
      STATUS_LOG_INITIAL_NAMES,
      logActual,
      warnings
    );
    cacheChanged = cacheChanged || r.bindingsChanged;
    resolvedLog = r.resolved;
  } else {
    resolvedLog = {} as Record<StatusLogRole, string>;
  }

  if (cacheChanged) {
    cache.lastResolvedAt = new Date().toISOString();
    saveCache(cache);
    console.log("[schema-resolver] 📝 notion-schema-cache.json を更新しました");
  } else {
    // touch lastResolvedAt するか迷うが、git diff 発生を抑えるためしない
  }

  return {
    companies: c.resolved,
    statusLog: resolvedLog,
    cacheChanged,
    warnings,
  };
}

function simplifyProps(raw: any): Record<string, { id: string; type: string }> {
  const out: Record<string, { id: string; type: string }> = {};
  for (const [name, info] of Object.entries(raw as Record<string, any>)) {
    out[name] = { id: info.id, type: info.type };
  }
  return out;
}

// 単体実行で cache の現状確認
async function main() {
  const { buildNotionClient, getCompaniesDbId, getStatusChangeLogDbId } = await import(
    "./notion.js"
  );
  const notion = buildNotionClient();
  const r = await resolveSchema(notion, getCompaniesDbId(), getStatusChangeLogDbId());
  console.log("companies:", r.companies);
  console.log("statusLog:", r.statusLog);
  if (r.warnings.length > 0) {
    console.error("⚠️ warnings:");
    for (const w of r.warnings) console.error("  - " + w);
    process.exit(1);
  }
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("schema-resolver.ts");
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
