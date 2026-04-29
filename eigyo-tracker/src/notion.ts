import { Client } from "@notionhq/client";
import type { CompanyRecord } from "./types.js";

const NAME_PROP = "名前";
const URL_PROP = "企業URL";
const CONTACT_PROP = "コンタクト";
const MEDIA_PROP = "媒体";

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

export async function fetchAllCompanies(
  notion: Client,
  dbId: string
): Promise<CompanyRecord[]> {
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
      const name = readTitle(props[NAME_PROP]);
      const url = readUrl(props[URL_PROP]);
      const contactYears = readMultiSelect(props[CONTACT_PROP]);
      const mediaTags = readMultiSelect(props[MEDIA_PROP]);
      records.push({ pageId: page.id, name, url, contactYears, mediaTags });
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
  args: { name: string; url: string; year: string; mediaTag: string }
) {
  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      [NAME_PROP]: { title: [{ text: { content: args.name } }] },
      [URL_PROP]: { url: args.url },
      [CONTACT_PROP]: { multi_select: [{ name: args.year }] },
      [MEDIA_PROP]: { multi_select: [{ name: args.mediaTag }] },
    },
  });
}

export async function updateCompany(
  notion: Client,
  record: CompanyRecord,
  year: string,
  mediaTag: string
) {
  const newYears = uniq([...record.contactYears, year]);
  const newMedia = uniq([...record.mediaTags, mediaTag]);
  const yearsChanged = newYears.length !== record.contactYears.length;
  const mediaChanged = newMedia.length !== record.mediaTags.length;
  if (!yearsChanged && !mediaChanged) return false;
  const properties: Record<string, any> = {};
  if (yearsChanged) {
    properties[CONTACT_PROP] = {
      multi_select: newYears.map((name) => ({ name })),
    };
  }
  if (mediaChanged) {
    properties[MEDIA_PROP] = {
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
