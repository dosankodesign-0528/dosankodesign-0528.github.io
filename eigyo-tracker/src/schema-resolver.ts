import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Client } from "@notionhq/client";

// 「役割」→ Notion プロパティ/オプションの対応。
// id は Notion 内部 ID（rename しても変わらない）。
// currentName はキャッシュ時点での名前。次回 sync 時、id で逆引きできれば最新名で上書きされる。

// ===================== プロパティ役割キー =====================

export const COMPANIES_ROLES = [
  "NAME",
  "URL",
  "CONTACT",
  "MEDIA",
  "STATUS",
  "LAST_CONTACT",
  "LAST_KNOWN",
  "DUP_FLAG",
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

// ===================== オプション役割キー =====================
// ※ 番号はコード上の internal key。Notion 上での見た目名は currentName。
// オプションが Notion 上で rename されてもこの key は変わらない。

export const STATUS_OPTION_KEYS = ["S", "A", "B", "C", "D", "WAITING"] as const;
export type StatusOptionKey = (typeof STATUS_OPTION_KEYS)[number];

export const BEFORE_OPTION_KEYS = [...STATUS_OPTION_KEYS, "NEW"] as const;
export type BeforeOptionKey = (typeof BEFORE_OPTION_KEYS)[number];

export const MEDIA_OPTION_KEYS = ["WANTEDLY", "GREEN", "SNS", "DIRECT"] as const;
export type MediaOptionKey = (typeof MEDIA_OPTION_KEYS)[number];

export const CATEGORY_OPTION_KEYS = ["AUTO", "MANUAL", "TIMEOUT", "NEW"] as const;
export type CategoryOptionKey = (typeof CATEGORY_OPTION_KEYS)[number];

// ===================== 初期値（最初のキャッシュ生成用 / fallback 用） =====================

const STATUS_OPTION_INITIAL: Record<StatusOptionKey, string> = {
  S: "S:継続中",
  A: "A：取引あり",
  B: "B：パートナー契約",
  C: "C：やりとりあり",
  D: "D:ご縁がなかった",
  WAITING: "待機中",
};

const BEFORE_OPTION_INITIAL: Record<BeforeOptionKey, string> = {
  ...STATUS_OPTION_INITIAL,
  NEW: "(新規)",
};

const MEDIA_OPTION_INITIAL: Record<MediaOptionKey, string> = {
  WANTEDLY: "Wantedly",
  GREEN: "Green",
  SNS: "SNS",
  DIRECT: "直メール/フォーム",
};

const CATEGORY_OPTION_INITIAL: Record<CategoryOptionKey, string> = {
  AUTO: "自動検知",
  MANUAL: "手動変更",
  TIMEOUT: "タイムアウト",
  NEW: "新規追加",
};

interface PropInitial<O extends string = string> {
  name: string;
  type: string;
  options?: Record<O, string>;
}

const COMPANIES_PROP_INITIAL: { [K in CompaniesRole]: PropInitial } = {
  NAME:         { name: "名前", type: "title" },
  URL:          { name: "企業URL", type: "url" },
  CONTACT:      { name: "連絡日時", type: "multi_select" }, // 年タグは流動なので options 不要
  MEDIA:        { name: "営業した媒体", type: "multi_select", options: MEDIA_OPTION_INITIAL },
  STATUS:       { name: "ステータス", type: "select", options: STATUS_OPTION_INITIAL },
  LAST_CONTACT: { name: "最終接触日", type: "date" },
  LAST_KNOWN:   { name: "前回ステータス（自動）", type: "rich_text" },
  DUP_FLAG:     { name: "重複疑い", type: "checkbox" },
};

const STATUS_LOG_PROP_INITIAL: { [K in StatusLogRole]: PropInitial } = {
  TITLE:       { name: "会社名", type: "title" },
  BEFORE:      { name: "Before", type: "select", options: BEFORE_OPTION_INITIAL },
  AFTER:       { name: "After", type: "select", options: STATUS_OPTION_INITIAL },
  CATEGORY:    { name: "判定種別", type: "select", options: CATEGORY_OPTION_INITIAL },
  EVIDENCE:    { name: "判定根拠", type: "rich_text" },
  CHANGED_AT:  { name: "変更日時", type: "date" },
  MEDIA:       { name: "媒体", type: "multi_select", options: MEDIA_OPTION_INITIAL },
  COMPANY_REL: { name: "会社ページ", type: "relation" },
};

// ===================== キャッシュ型 =====================

interface OptionBinding {
  id: string | null;
  currentName: string;
}

interface PropBinding {
  id: string | null;
  currentName: string;
  type: string;
  optionsByRole?: Record<string, OptionBinding>;
}

interface DbBindings {
  dbId: string;
  props: Record<string, PropBinding>;
}

interface SchemaCache {
  schemaVersion: 2;
  lastResolvedAt: string;
  companies: DbBindings;
  statusLog: DbBindings;
}

// ===================== 解決後の型 =====================

export interface ResolvedSchema {
  companies: {
    props: Record<CompaniesRole, string>;
    statusOptions: Record<StatusOptionKey, string>;
    mediaOptions: Record<MediaOptionKey, string>;
  };
  statusLog: {
    props: Record<StatusLogRole, string>;
    beforeOptions: Record<BeforeOptionKey, string>;
    afterOptions: Record<StatusOptionKey, string>;
    categoryOptions: Record<CategoryOptionKey, string>;
    mediaOptions: Record<MediaOptionKey, string>;
  };
  // restorer 用に「未解決」のヒントを残す
  cacheChanged: boolean;
  warnings: string[];
  // 後段の self-heal で復元するための欠落情報
  missing: MissingItem[];
}

export type MissingItem =
  | { kind: "prop_missing"; db: "companies" | "statusLog"; role: string; init: PropInitial }
  | { kind: "prop_type_mismatch"; db: "companies" | "statusLog"; role: string; expectedType: string; actualType: string; propertyName: string }
  | { kind: "option_missing"; db: "companies" | "statusLog"; role: string; optionRole: string; init: { name: string }; propertyName: string; propertyType: "select" | "multi_select" };

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CACHE_PATH = join(__dirname, "..", "notion-schema-cache.json");

// ===================== I/O =====================

function loadCache(): SchemaCache | null {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
    // v1 (options 無し) は破棄して再生成させる
    if (parsed?.schemaVersion !== 2) return null;
    return parsed;
  } catch (e) {
    console.warn(`[schema-resolver] cache parse failed: ${(e as Error).message}`);
    return null;
  }
}

function saveCache(cache: SchemaCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

function emptyBindings(dbId: string, initial: { [k: string]: PropInitial }): DbBindings {
  const props: Record<string, PropBinding> = {};
  for (const [role, v] of Object.entries(initial)) {
    const b: PropBinding = { id: null, currentName: v.name, type: v.type };
    if (v.options) {
      b.optionsByRole = {};
      for (const [optRole, optName] of Object.entries(v.options)) {
        b.optionsByRole[optRole] = { id: null, currentName: optName };
      }
    }
    props[role] = b;
  }
  return { dbId, props };
}

// ===================== Resolve ロジック =====================

interface PropResult {
  resolvedName: string;
  bindingsChanged: boolean;
  optionsByRole: Record<string, string>; // role -> current option name
}

function resolveProp(
  label: string,
  role: string,
  binding: PropBinding,
  init: PropInitial,
  actualProps: Record<string, { id: string; type: string; rawOptions: Array<{ id: string; name: string }> }>,
  missing: MissingItem[],
  db: "companies" | "statusLog"
): PropResult {
  let bindingsChanged = false;
  let actualName: string | null = null;
  let actualType: string | null = null;
  let actualOptionsList: Array<{ id: string; name: string }> = [];

  // 1) ID で逆引き
  if (binding.id) {
    for (const [name, p] of Object.entries(actualProps)) {
      if (p.id === binding.id) {
        actualName = name;
        actualType = p.type;
        actualOptionsList = p.rawOptions;
        break;
      }
    }
  }
  // 2) cached currentName で名前一致
  if (!actualName && binding.currentName) {
    const p = actualProps[binding.currentName];
    if (p) {
      actualName = binding.currentName;
      actualType = p.type;
      actualOptionsList = p.rawOptions;
      if (binding.id !== p.id) {
        binding.id = p.id;
        bindingsChanged = true;
      }
    }
  }
  // 3) initial name で fallback
  if (!actualName) {
    const p = actualProps[init.name];
    if (p) {
      actualName = init.name;
      actualType = p.type;
      actualOptionsList = p.rawOptions;
      binding.id = p.id;
      binding.currentName = init.name;
      bindingsChanged = true;
    }
  }

  if (!actualName) {
    // 完全欠落 → restorer に任せる
    missing.push({ kind: "prop_missing", db, role, init });
    return { resolvedName: binding.currentName || init.name, bindingsChanged, optionsByRole: {} };
  }

  // 型一致チェック
  if (actualType !== init.type) {
    missing.push({
      kind: "prop_type_mismatch",
      db, role,
      expectedType: init.type,
      actualType: actualType!,
      propertyName: actualName,
    });
    // 型違いだとオプションも比較できないので一旦終了
    return { resolvedName: actualName, bindingsChanged, optionsByRole: {} };
  }

  // currentName / type を最新に
  if (actualName !== binding.currentName) {
    binding.currentName = actualName;
    bindingsChanged = true;
  }
  if (actualType !== binding.type) {
    binding.type = actualType;
    bindingsChanged = true;
  }

  // オプション解決
  const optionsByRole: Record<string, string> = {};
  if (init.options) {
    if (!binding.optionsByRole) {
      binding.optionsByRole = {};
      bindingsChanged = true;
    }
    const optByCachedRole = binding.optionsByRole;
    const actualOptById = new Map(actualOptionsList.map((o) => [o.id, o]));
    const actualOptByName = new Map(actualOptionsList.map((o) => [o.name, o]));
    for (const [optRole, initOptName] of Object.entries(init.options)) {
      let cached = optByCachedRole[optRole];
      if (!cached) {
        cached = { id: null, currentName: initOptName };
        optByCachedRole[optRole] = cached;
        bindingsChanged = true;
      }
      // 1) ID で
      let hitName: string | null = null;
      if (cached.id) {
        const o = actualOptById.get(cached.id);
        if (o) hitName = o.name;
      }
      // 2) cached currentName で
      if (!hitName && cached.currentName) {
        const o = actualOptByName.get(cached.currentName);
        if (o) {
          hitName = o.name;
          if (cached.id !== o.id) {
            cached.id = o.id;
            bindingsChanged = true;
          }
        }
      }
      // 3) initial name で
      if (!hitName) {
        const o = actualOptByName.get(initOptName);
        if (o) {
          hitName = o.name;
          cached.id = o.id;
          cached.currentName = initOptName;
          bindingsChanged = true;
        }
      }

      if (!hitName) {
        // オプション欠落 → restorer
        missing.push({
          kind: "option_missing",
          db, role,
          optionRole: optRole,
          init: { name: initOptName },
          propertyName: actualName,
          propertyType: actualType as "select" | "multi_select",
        });
        optionsByRole[optRole] = cached.currentName || initOptName;
      } else {
        if (hitName !== cached.currentName) {
          cached.currentName = hitName;
          bindingsChanged = true;
        }
        optionsByRole[optRole] = hitName;
      }
    }
  }

  return { resolvedName: actualName, bindingsChanged, optionsByRole };
}

function simplifyProps(raw: any): Record<string, { id: string; type: string; rawOptions: Array<{ id: string; name: string }> }> {
  const out: Record<string, { id: string; type: string; rawOptions: Array<{ id: string; name: string }> }> = {};
  for (const [name, info] of Object.entries(raw as Record<string, any>)) {
    const type = info.type;
    let rawOptions: Array<{ id: string; name: string }> = [];
    if (type === "select" || type === "multi_select") {
      rawOptions = (info[type]?.options ?? []).map((o: any) => ({ id: o.id, name: o.name }));
    }
    out[name] = { id: info.id, type, rawOptions };
  }
  return out;
}

export async function resolveSchema(
  notion: Client,
  companiesDbId: string,
  statusLogDbId: string | null
): Promise<ResolvedSchema> {
  const cache: SchemaCache =
    loadCache() ?? {
      schemaVersion: 2,
      lastResolvedAt: new Date(0).toISOString(),
      companies: emptyBindings(companiesDbId, COMPANIES_PROP_INITIAL as any),
      statusLog: emptyBindings(statusLogDbId ?? "", STATUS_LOG_PROP_INITIAL as any),
    };

  if (cache.companies.dbId !== companiesDbId) {
    cache.companies = emptyBindings(companiesDbId, COMPANIES_PROP_INITIAL as any);
  }
  if (statusLogDbId && cache.statusLog.dbId !== statusLogDbId) {
    cache.statusLog = emptyBindings(statusLogDbId, STATUS_LOG_PROP_INITIAL as any);
  }

  // 既存 cache に options 欠落してたら埋める（v2 への移行救済）
  for (const [role, init] of Object.entries(COMPANIES_PROP_INITIAL)) {
    if (init.options && cache.companies.props[role] && !cache.companies.props[role].optionsByRole) {
      cache.companies.props[role].optionsByRole = Object.fromEntries(
        Object.entries(init.options).map(([k, v]) => [k, { id: null, currentName: v as string }])
      );
    }
  }
  if (statusLogDbId) {
    for (const [role, init] of Object.entries(STATUS_LOG_PROP_INITIAL)) {
      if (init.options && cache.statusLog.props[role] && !cache.statusLog.props[role].optionsByRole) {
        cache.statusLog.props[role].optionsByRole = Object.fromEntries(
          Object.entries(init.options).map(([k, v]) => [k, { id: null, currentName: v as string }])
        );
      }
    }
  }

  const warnings: string[] = [];
  const missing: MissingItem[] = [];
  let cacheChanged = false;

  // === Companies ===
  const companiesDb: any = await notion.databases.retrieve({ database_id: companiesDbId });
  const companiesActual = simplifyProps(companiesDb.properties);
  const compProps: Record<CompaniesRole, string> = {} as any;
  const compStatusOptions: Record<StatusOptionKey, string> = {} as any;
  const compMediaOptions: Record<MediaOptionKey, string> = {} as any;

  for (const role of COMPANIES_ROLES) {
    const init = COMPANIES_PROP_INITIAL[role];
    const r = resolveProp(
      "企業リスト", role,
      cache.companies.props[role]!, init,
      companiesActual, missing, "companies"
    );
    if (r.bindingsChanged) cacheChanged = true;
    compProps[role] = r.resolvedName;
    if (role === "STATUS") {
      for (const k of STATUS_OPTION_KEYS) compStatusOptions[k] = r.optionsByRole[k] ?? STATUS_OPTION_INITIAL[k];
    }
    if (role === "MEDIA") {
      for (const k of MEDIA_OPTION_KEYS) compMediaOptions[k] = r.optionsByRole[k] ?? MEDIA_OPTION_INITIAL[k];
    }
  }

  // === Status Log ===
  const logProps: Record<StatusLogRole, string> = {} as any;
  const beforeOptions: Record<BeforeOptionKey, string> = {} as any;
  const afterOptions: Record<StatusOptionKey, string> = {} as any;
  const categoryOptions: Record<CategoryOptionKey, string> = {} as any;
  const logMediaOptions: Record<MediaOptionKey, string> = {} as any;

  if (statusLogDbId) {
    const logDb: any = await notion.databases.retrieve({ database_id: statusLogDbId });
    const logActual = simplifyProps(logDb.properties);
    for (const role of STATUS_LOG_ROLES) {
      const init = STATUS_LOG_PROP_INITIAL[role];
      const r = resolveProp(
        "ステータス変更ログ", role,
        cache.statusLog.props[role]!, init,
        logActual, missing, "statusLog"
      );
      if (r.bindingsChanged) cacheChanged = true;
      logProps[role] = r.resolvedName;
      if (role === "BEFORE") {
        for (const k of BEFORE_OPTION_KEYS) beforeOptions[k] = r.optionsByRole[k] ?? BEFORE_OPTION_INITIAL[k];
      } else if (role === "AFTER") {
        for (const k of STATUS_OPTION_KEYS) afterOptions[k] = r.optionsByRole[k] ?? STATUS_OPTION_INITIAL[k];
      } else if (role === "CATEGORY") {
        for (const k of CATEGORY_OPTION_KEYS) categoryOptions[k] = r.optionsByRole[k] ?? CATEGORY_OPTION_INITIAL[k];
      } else if (role === "MEDIA") {
        for (const k of MEDIA_OPTION_KEYS) logMediaOptions[k] = r.optionsByRole[k] ?? MEDIA_OPTION_INITIAL[k];
      }
    }
  }

  if (cacheChanged) {
    cache.lastResolvedAt = new Date().toISOString();
    saveCache(cache);
    console.log("[schema-resolver] 📝 notion-schema-cache.json を更新しました");
  }

  return {
    companies: { props: compProps, statusOptions: compStatusOptions, mediaOptions: compMediaOptions },
    statusLog: { props: logProps, beforeOptions, afterOptions, categoryOptions, mediaOptions: logMediaOptions },
    cacheChanged,
    warnings,
    missing,
  };
}

// resolve した後、status 値の name → role key 逆引きに便利な map を作る
export function statusKeyByName(schema: ResolvedSchema): Map<string, StatusOptionKey> {
  const m = new Map<string, StatusOptionKey>();
  for (const k of STATUS_OPTION_KEYS) m.set(schema.companies.statusOptions[k], k);
  return m;
}

export function mediaKeyByName(schema: ResolvedSchema): Map<string, MediaOptionKey> {
  const m = new Map<string, MediaOptionKey>();
  for (const k of MEDIA_OPTION_KEYS) m.set(schema.companies.mediaOptions[k], k);
  return m;
}

// 単体実行
async function main() {
  const { buildNotionClient, getCompaniesDbId, getStatusChangeLogDbId } = await import(
    "./notion.js"
  );
  const notion = buildNotionClient();
  const r = await resolveSchema(notion, getCompaniesDbId(), getStatusChangeLogDbId());
  console.log("companies.props:", r.companies.props);
  console.log("companies.statusOptions:", r.companies.statusOptions);
  console.log("companies.mediaOptions:", r.companies.mediaOptions);
  console.log("statusLog.props:", r.statusLog.props);
  console.log("missing:", r.missing);
  if (r.warnings.length > 0 || r.missing.length > 0) {
    process.exit(r.missing.length > 0 ? 2 : 0);
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
