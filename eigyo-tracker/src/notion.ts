import { Client } from "@notionhq/client";
import type { CompanyRecord } from "./types.js";
import type {
  ResolvedSchema,
  StatusOptionKey,
  BeforeOptionKey,
  CategoryOptionKey,
} from "./schema-resolver.js";
import { statusKeyByName, STATUS_OPTION_KEYS } from "./schema-resolver.js";

// プロパティ名・オプション名はランタイムで schema-resolver が解決する。
// 起動時に index.ts で resolveSchema() の結果をここに渡す。
// この設計のおかげで、Notion 側で名前が変わってもコード修正不要。
type CompaniesSchema = ResolvedSchema["companies"];
type StatusLogSchema = ResolvedSchema["statusLog"];

export function buildNotionClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN missing");
  return new Client({ auth: token });
}

export function getCompaniesDbId(): string {
  const id = process.env.NOTION_COMPANIES_DB_ID;
  if (!id) throw new Error("NOTION_COMPANIES_DB_ID missing");
  return id;
}

export function getStatusChangeLogDbId(): string | null {
  return process.env.NOTION_STATUS_CHANGE_LOG_DB_ID ?? null;
}

export type StatusChangeCategory = "自動検知" | "手動変更" | "タイムアウト" | "新規追加";

export interface StatusChangeLog {
  pageId: string;
  companyName: string;
  companyPageId: string | null;
  before: string | null;
  after: string;
  mediaTags: string[];
  changedAt: Date;
  category: StatusChangeCategory | null;
  evidence: string;
}

const CATEGORY_BY_SIGNAL: Record<StatusChangeCategory, CategoryOptionKey> = {
  自動検知: "AUTO",
  手動変更: "MANUAL",
  タイムアウト: "TIMEOUT",
  新規追加: "NEW",
};

export async function addStatusChangeLog(
  notion: Client,
  dbId: string,
  logSchema: StatusLogSchema,
  args: {
    companyName: string;
    companyPageId?: string;
    beforeKey: StatusOptionKey | null; // null → 新規
    afterKey: StatusOptionKey;
    mediaTags: string[];
    changedAt?: Date;
    category: StatusChangeCategory;
    evidence: string;
  }
): Promise<void> {
  const names = logSchema.props;
  const beforeName = args.beforeKey
    ? logSchema.beforeOptions[args.beforeKey]
    : logSchema.beforeOptions.NEW;
  const afterName = logSchema.afterOptions[args.afterKey];
  const categoryName = logSchema.categoryOptions[CATEGORY_BY_SIGNAL[args.category]];
  const properties: Record<string, any> = {
    [names.TITLE]: { title: [{ text: { content: args.companyName } }] },
    [names.BEFORE]: { select: { name: beforeName } },
    [names.AFTER]: { select: { name: afterName } },
    [names.CATEGORY]: { select: { name: categoryName } },
    [names.EVIDENCE]: { rich_text: [{ text: { content: args.evidence } }] },
    [names.CHANGED_AT]: {
      date: { start: (args.changedAt ?? new Date()).toISOString() },
    },
  };
  if (args.mediaTags.length > 0) {
    properties[names.MEDIA] = {
      multi_select: args.mediaTags.map((name) => ({ name })),
    };
  }
  if (args.companyPageId) {
    properties[names.COMPANY_REL] = { relation: [{ id: args.companyPageId }] };
  }
  await notion.pages.create({
    parent: { database_id: dbId },
    properties,
  });
}

export async function fetchStatusChangesInRange(
  notion: Client,
  dbId: string,
  logSchema: StatusLogSchema,
  start: Date,
  end: Date
): Promise<StatusChangeLog[]> {
  const names = logSchema.props;
  const logs: StatusChangeLog[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: names.CHANGED_AT,
        date: {
          on_or_after: start.toISOString(),
          before: end.toISOString(),
        },
      },
      sorts: [{ property: names.CHANGED_AT, direction: "ascending" }],
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of res.results) {
      const props = p.properties ?? {};
      const companyName = readTitle(props[names.TITLE]);
      const before = readSelect(props[names.BEFORE]);
      const after = readSelect(props[names.AFTER]);
      const mediaTags = readMultiSelect(props[names.MEDIA]);
      const changedAt = readDate(props[names.CHANGED_AT]) ?? new Date(p.created_time);
      const relProp = props[names.COMPANY_REL];
      const companyPageId =
        relProp?.type === "relation" && Array.isArray(relProp.relation) && relProp.relation[0]
          ? relProp.relation[0].id
          : null;
      const category = readSelect(props[names.CATEGORY]) as StatusChangeCategory | null;
      const evidenceProp = props[names.EVIDENCE];
      const evidence =
        evidenceProp?.type === "rich_text"
          ? (evidenceProp.rich_text ?? []).map((t: any) => t.plain_text ?? "").join("")
          : "";
      if (!after) continue;
      // 「(新規)」相当 → null。Notion 上で rename されていても判定できるよう BEFORE_NEW で比較。
      const beforeNewName = logSchema.beforeOptions.NEW;
      logs.push({
        pageId: p.id,
        companyName,
        companyPageId,
        before: before === beforeNewName ? null : before,
        after,
        mediaTags,
        changedAt,
        category,
        evidence,
      });
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return logs;
}

export async function fetchAllCompanies(
  notion: Client,
  dbId: string,
  schema: ResolvedSchema
): Promise<CompanyRecord[]> {
  const compSchema = schema.companies;
  const names = compSchema.props;
  const statusKeyMap = statusKeyByName(schema);
  const records: CompanyRecord[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of res.results) {
      const props = page.properties ?? {};
      const name = readTitle(props[names.NAME]);
      const url = readUrl(props[names.URL]);
      const contactYears = readMultiSelect(props[names.CONTACT]);
      const mediaTags = readMultiSelect(props[names.MEDIA]);
      const status = readSelect(props[names.STATUS]);
      const lastContactAt = readDate(props[names.LAST_CONTACT]);
      const lastKnownRaw = readRichText(props[names.LAST_KNOWN]);
      // lastKnownStatus は内部 key (例 "WAITING") で保存している前提。
      // 旧フォーマットの「現在 name」が残っていれば逆引きで救済。
      let lastKnownStatusKey: StatusOptionKey | null = null;
      if (lastKnownRaw) {
        if ((STATUS_OPTION_KEYS as readonly string[]).includes(lastKnownRaw)) {
          lastKnownStatusKey = lastKnownRaw as StatusOptionKey;
        } else {
          lastKnownStatusKey = statusKeyMap.get(lastKnownRaw) ?? null;
        }
      }
      records.push({
        pageId: page.id,
        name,
        url,
        contactYears,
        mediaTags,
        status,
        statusKey: status ? statusKeyMap.get(status) ?? null : null,
        lastContactAt,
        lastKnownStatus: lastKnownRaw || null,
        lastKnownStatusKey,
      });
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return records;
}

export function findCompany(
  records: CompanyRecord[],
  domain: string,
  name: string
): CompanyRecord | undefined {
  const byDomain = records.find(
    (r) => r.url && extractHost(r.url) === domain
  );
  if (byDomain) return byDomain;
  const normalizedName = normalizeName(name);
  return records.find((r) => normalizeName(r.name) === normalizedName);
}

export async function addCompany(
  notion: Client,
  dbId: string,
  compSchema: CompaniesSchema,
  args: { name: string; url: string; year: string; mediaTag: string; statusKey?: StatusOptionKey; lastContactAt?: Date }
) {
  const names = compSchema.props;
  const properties: Record<string, any> = {
    [names.NAME]: { title: [{ text: { content: args.name } }] },
    [names.URL]: { url: args.url },
    [names.CONTACT]: { multi_select: [{ name: args.year }] },
    [names.MEDIA]: { multi_select: [{ name: args.mediaTag }] },
  };
  if (args.statusKey) {
    const statusName = compSchema.statusOptions[args.statusKey];
    properties[names.STATUS] = { select: { name: statusName } };
    // lastKnownStatus は内部 key で保存（name rename に強い）
    properties[names.LAST_KNOWN] = { rich_text: [{ text: { content: args.statusKey } }] };
  }
  if (args.lastContactAt) {
    properties[names.LAST_CONTACT] = { date: { start: args.lastContactAt.toISOString().slice(0, 10) } };
  }
  await notion.pages.create({
    parent: { database_id: dbId },
    properties,
  });
}

export async function updateCompanyStatus(
  notion: Client,
  compSchema: CompaniesSchema,
  pageId: string,
  statusKey: StatusOptionKey
): Promise<void> {
  // ステータス（現在の Notion 表示名）と lastKnownStatus（内部キー）を同時に書く。
  // 次回 sync で statusKey 同士が一致 → 「手動変更ではない」と判定できる。
  const names = compSchema.props;
  const statusName = compSchema.statusOptions[statusKey];
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [names.STATUS]: { select: { name: statusName } },
      [names.LAST_KNOWN]: { rich_text: [{ text: { content: statusKey } }] },
    },
  });
}

export async function syncLastKnownStatus(
  notion: Client,
  compSchema: CompaniesSchema,
  pageId: string,
  statusKey: StatusOptionKey
): Promise<void> {
  const names = compSchema.props;
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [names.LAST_KNOWN]: { rich_text: [{ text: { content: statusKey } }] },
    },
  });
}

export async function updateLastContact(
  notion: Client,
  compSchema: CompaniesSchema,
  pageId: string,
  date: Date
): Promise<void> {
  const names = compSchema.props;
  const iso = date.toISOString().slice(0, 10);
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [names.LAST_CONTACT]: { date: { start: iso } },
    },
  });
}

export async function updateCompany(
  notion: Client,
  compSchema: CompaniesSchema,
  record: CompanyRecord,
  year: string,
  mediaTag: string
) {
  const names = compSchema.props;
  const newYears = uniq([...record.contactYears, year]);
  const newMedia = uniq([...record.mediaTags, mediaTag]);
  const yearsChanged = newYears.length !== record.contactYears.length;
  const mediaChanged = newMedia.length !== record.mediaTags.length;
  if (!yearsChanged && !mediaChanged) return false;
  const properties: Record<string, any> = {};
  if (yearsChanged) {
    properties[names.CONTACT] = {
      multi_select: newYears.map((name) => ({ name })),
    };
  }
  if (mediaChanged) {
    properties[names.MEDIA] = {
      multi_select: newMedia.map((name) => ({ name })),
    };
  }
  await notion.pages.update({ page_id: record.pageId, properties });
  return true;
}

function readTitle(prop: any): string {
  if (!prop || prop.type !== "title") return "";
  return (prop.title ?? []).map((t: any) => t.plain_text ?? "").join("");
}

function readUrl(prop: any): string | null {
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}

function readMultiSelect(prop: any): string[] {
  if (!prop || prop.type !== "multi_select") return [];
  return (prop.multi_select ?? []).map((m: any) => m.name as string);
}

function readSelect(prop: any): string | null {
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function readRichText(prop: any): string {
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((t: any) => t.plain_text ?? "").join("");
}

function readDate(prop: any): Date | null {
  if (!prop || prop.type !== "date" || !prop.date?.start) return null;
  return new Date(prop.date.start);
}

function extractHost(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  }
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/株式会社|（株）|\(株\)|有限会社|inc\.?|llc|co\.?,?\s*ltd\.?/g, "");
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
