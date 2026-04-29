import "dotenv/config";
import { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId } from "./notion.js";

interface PageInfo {
  pageId: string;
  name: string;
  url: string | null;
  createdAt: Date;
  lastEditedAt: Date;
  mediaTags: string[];
}

const MEDIA_TAGS = ["Wantedly", "Green", "問合せフォーム", "直営業", "その他"];

function getReportDbId(): string {
  const id = process.env.NOTION_REPORT_DB_ID;
  if (!id) throw new Error("NOTION_REPORT_DB_ID missing");
  return id;
}

function getTargetMonthRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const mode = process.env.REPORT_MODE ?? "previous";
  let target: Date;
  if (mode === "current") {
    target = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  const start = new Date(target.getFullYear(), target.getMonth(), 1);
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 1);
  const suffix = mode === "current" ? "（途中経過）" : "";
  const label = `${target.getFullYear()}年${target.getMonth() + 1}月レポート${suffix}`;
  return { start, end, label };
}

async function fetchPagesInRange(
  notion: Client,
  dbId: string,
  start: Date,
  end: Date
): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.databases.query({
      database_id: dbId,
      filter: {
        or: [
          { timestamp: "created_time", created_time: { on_or_after: start.toISOString(), before: end.toISOString() } },
          { timestamp: "last_edited_time", last_edited_time: { on_or_after: start.toISOString(), before: end.toISOString() } },
        ],
      },
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
      const mediaProp = props["媒体"];
      const mediaTags = mediaProp?.type === "multi_select"
        ? (mediaProp.multi_select ?? []).map((m: any) => m.name as string)
        : [];
      pages.push({
        pageId: p.id,
        name,
        url,
        createdAt: new Date(p.created_time),
        lastEditedAt: new Date(p.last_edited_time),
        mediaTags,
      });
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return pages;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pageMentionLink(p: PageInfo): { type: "mention"; mention: { type: "page"; page: { id: string } } } {
  return { type: "mention", mention: { type: "page", page: { id: p.pageId } } };
}

function bullet(p: PageInfo): any {
  const richText: any[] = [pageMentionLink(p)];
  if (p.url) {
    richText.push({ type: "text", text: { content: ` （${p.url}）`, link: { url: p.url } } });
  }
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText },
  };
}

function heading(level: 2 | 3, content: string): any {
  const block: any = {
    object: "block",
    type: `heading_${level}`,
  };
  block[`heading_${level}`] = { rich_text: [{ type: "text", text: { content } }] };
  return block;
}

function paragraph(content: string): any {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content } }] },
  };
}

function buildBlocks(args: {
  added: PageInfo[];
  updated: PageInfo[];
  start: Date;
  end: Date;
}): any[] {
  const blocks: any[] = [];
  const { added, updated, start, end } = args;

  blocks.push(paragraph(`期間: ${formatDate(start)} 〜 ${formatDate(new Date(end.getTime() - 1))}`));
  blocks.push(paragraph(`新規追加: ${added.length} 社、更新: ${updated.length} 社`));

  blocks.push(heading(2, "🆕 新規追加された企業"));
  if (added.length === 0) {
    blocks.push(paragraph("（新規追加なし）"));
  } else {
    for (const tag of MEDIA_TAGS) {
      const matching = added.filter((p) => p.mediaTags.includes(tag));
      if (matching.length === 0) continue;
      blocks.push(heading(3, `${tag} 経由 (${matching.length} 社)`));
      for (const p of matching) blocks.push(bullet(p));
    }
    const noTag = added.filter((p) => p.mediaTags.length === 0);
    if (noTag.length > 0) {
      blocks.push(heading(3, `媒体タグなし (${noTag.length} 社)`));
      for (const p of noTag) blocks.push(bullet(p));
    }
  }

  blocks.push(heading(2, "♻️ 更新された企業"));
  if (updated.length === 0) {
    blocks.push(paragraph("（更新なし）"));
  } else {
    for (const tag of MEDIA_TAGS) {
      const matching = updated.filter((p) => p.mediaTags.includes(tag));
      if (matching.length === 0) continue;
      blocks.push(heading(3, `${tag} 経由 (${matching.length} 社)`));
      for (const p of matching) blocks.push(bullet(p));
    }
  }

  return blocks;
}

async function main() {
  const { start, end, label } = getTargetMonthRange();
  console.log(`[monthly-report] 対象期間: ${formatDate(start)} 〜 ${formatDate(new Date(end.getTime() - 1))}`);
  console.log(`[monthly-report] レポート名: ${label}`);

  const notion = buildNotionClient();
  const companiesDbId = getCompaniesDbId();
  const reportDbId = getReportDbId();

  const pages = await fetchPagesInRange(notion, companiesDbId, start, end);
  console.log(`[monthly-report] 期間内変更ページ: ${pages.length} 件`);

  const added = pages.filter((p) => p.createdAt >= start && p.createdAt < end);
  const updated = pages.filter((p) => !(p.createdAt >= start && p.createdAt < end));

  const mediaCount = (tag: string) =>
    pages.filter((p) => p.mediaTags.includes(tag)).length;

  const wantedlyCount = mediaCount("Wantedly");
  const greenCount = mediaCount("Green");
  const inquiryCount = mediaCount("問合せフォーム");
  const directCount = mediaCount("直営業");

  console.log(`  新規追加: ${added.length}`);
  console.log(`  更新: ${updated.length}`);
  console.log(`  Wantedly: ${wantedlyCount}, Green: ${greenCount}, 問合せ: ${inquiryCount}, 直営業: ${directCount}`);

  const allBlocks = buildBlocks({ added, updated, start, end });
  const firstBatch = allBlocks.slice(0, 90);
  const restBatches: any[][] = [];
  for (let i = 90; i < allBlocks.length; i += 90) {
    restBatches.push(allBlocks.slice(i, i + 90));
  }

  const created: any = await notion.pages.create({
    parent: { database_id: reportDbId },
    properties: {
      期間: { title: [{ text: { content: label } }] },
      開始日: { date: { start: formatDate(start) } },
      終了日: { date: { start: formatDate(new Date(end.getTime() - 1)) } },
      新規追加件数: { number: added.length },
      更新件数: { number: updated.length },
      "Wantedly件数": { number: wantedlyCount },
      "Green件数": { number: greenCount },
      問合せフォーム件数: { number: inquiryCount },
      直営業件数: { number: directCount },
      拾い損ねメール: { number: 0 },
      頻出キーワード: { rich_text: [{ text: { content: "" } }] },
      備考: { rich_text: [{ text: { content: "詳細はページを開いてください" } }] },
    },
    children: firstBatch,
  });
  console.log(`[monthly-report] ✅ レポートページ作成: ${created.url}`);

  for (const batch of restBatches) {
    await notion.blocks.children.append({
      block_id: created.id,
      children: batch,
    });
  }
  console.log(`[monthly-report] 全ブロック追加完了 (合計 ${allBlocks.length} blocks)`);
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
