import "dotenv/config";
import { Client } from "@notionhq/client";
import { buildNotionClient, getCompaniesDbId } from "./notion.js";
import { notifyMention } from "./notify.js";

interface PageInfo {
  pageId: string;
  name: string;
  url: string | null;
  createdAt: Date;
  lastEditedAt: Date;
  mediaTags: string[];
  contactYears: string[];
  status: string | null;
  lastContactAt: Date | null;
}

const MEDIA_TAGS = ["Wantedly", "Green", "SNS", "直メール/フォーム"];
const STATUS_D = "D:ご縁がなかった";
const TIMEOUT_DAYS = Number(process.env.TIMEOUT_DAYS ?? "14");

const MEDIA_ICONS: Record<string, string> = {
  Wantedly: "💼",
  Green: "🌱",
  SNS: "📱",
  "直メール/フォーム": "🌟",
};

function getReportDbId(): string {
  const id = process.env.NOTION_REPORT_DB_ID;
  if (!id) throw new Error("NOTION_REPORT_DB_ID missing");
  return id;
}

function getTargetMonthRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const days = process.env.REPORT_DAYS ? Number(process.env.REPORT_DAYS) : null;
  if (days && days > 0) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const label = `直近 ${days} 日間のレポート（${start.getMonth() + 1}/${start.getDate()} 〜 ${now.getMonth() + 1}/${now.getDate()}）`;
    return { start, end, label };
  }
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
  const label = `${target.getFullYear()}年${target.getMonth() + 1}月のレポート${suffix}`;
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
      const contactProp = props["コンタクト"];
      const contactYears = contactProp?.type === "multi_select"
        ? (contactProp.multi_select ?? []).map((m: any) => m.name as string)
        : [];
      const statusProp = props["ステータス"];
      const status = statusProp?.type === "select" ? statusProp.select?.name ?? null : null;
      const lastContactProp = props["最終接触日"];
      const lastContactAt = lastContactProp?.type === "date" && lastContactProp.date?.start
        ? new Date(lastContactProp.date.start)
        : null;
      pages.push({
        pageId: p.id,
        name,
        url,
        createdAt: new Date(p.created_time),
        lastEditedAt: new Date(p.last_edited_time),
        mediaTags,
        contactYears,
        status,
        lastContactAt,
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

function formatJapaneseDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function pageMention(p: PageInfo): any {
  return { type: "mention", mention: { type: "page", page: { id: p.pageId } } };
}

function bullet(p: PageInfo): any {
  const richText: any[] = [pageMention(p)];
  const tags = p.mediaTags.length > 0 ? `（${p.mediaTags.join(" / ")}）` : "";
  if (tags) richText.push({ type: "text", text: { content: tags } });
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText },
  };
}

function heading(level: 2 | 3, content: string, color?: string): any {
  const block: any = {
    object: "block",
    type: `heading_${level}`,
  };
  block[`heading_${level}`] = {
    rich_text: [{ type: "text", text: { content } }],
    ...(color ? { color } : {}),
  };
  return block;
}

function paragraph(content: string, color?: string): any {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content } }],
      ...(color ? { color } : {}),
    },
  };
}

function divider(): any {
  return { object: "block", type: "divider", divider: {} };
}

function callout(content: string, emoji = "💡", color = "yellow_background"): any {
  return {
    object: "block",
    type: "callout",
    callout: {
      icon: { type: "emoji", emoji },
      color,
      rich_text: [{ type: "text", text: { content } }],
    },
  };
}

function makeBar(ratio: number, length = 10): string {
  const filled = Math.round(ratio * length);
  return "█".repeat(Math.max(0, Math.min(length, filled))) + "░".repeat(Math.max(0, length - filled));
}

function buildBlocks(args: {
  added: PageInfo[];
  updated: PageInfo[];
  timedOut: PageInfo[];
  start: Date;
  end: Date;
  mediaCounts: Record<string, number>;
  totalForMedia: number;
}): any[] {
  const blocks: any[] = [];
  const { added, updated, timedOut, start, end, mediaCounts, totalForMedia } = args;

  const days = process.env.REPORT_DAYS ? Number(process.env.REPORT_DAYS) : 0;
  const periodLabel = days > 0 ? `直近${days}日間で` : `${start.getFullYear()}年${start.getMonth() + 1}月は、`;
  const mainSentence = added.length > 0
    ? `${periodLabel}新しく ${added.length} 社が追加されました。ステータスが更新された会社は ${updated.length} 社です。`
    : `${periodLabel}新しく追加された会社はありませんでした。ステータスが更新された会社は ${updated.length} 社です。`;
  blocks.push(callout(mainSentence, "💡"));

  blocks.push(paragraph(`期間: ${formatJapaneseDate(start)} 〜 ${formatJapaneseDate(new Date(end.getTime() - 1))}`, "gray"));
  blocks.push(divider());

  blocks.push(heading(2, "📈 今月の動き"));
  blocks.push(paragraph(`🆕 新しく追加された会社        ${added.length} 社`));
  blocks.push(paragraph(`♻️ ステータスが更新された会社  ${updated.length} 社`));
  blocks.push(paragraph(`⏰ タイムアウト（${TIMEOUT_DAYS}日反応なし→D）  ${timedOut.length} 社`));
  blocks.push(divider());

  blocks.push(heading(2, "🎯 どこから来たか（媒体別の内訳）"));
  if (totalForMedia === 0) {
    blocks.push(paragraph("（媒体別のデータはまだありません）", "gray"));
  } else {
    for (const tag of MEDIA_TAGS) {
      const count = mediaCounts[tag] ?? 0;
      const ratio = count / totalForMedia;
      const percent = (ratio * 100).toFixed(0);
      const bar = makeBar(ratio);
      const icon = MEDIA_ICONS[tag] ?? "▫️";
      blocks.push(paragraph(`${icon}  ${tag.padEnd(15, "　")}  ${bar}  ${count} 社（${percent}%）`));
    }
  }
  blocks.push(divider());

  blocks.push(heading(2, "🆕 新しく追加された会社"));
  if (added.length === 0) {
    blocks.push(paragraph("（今月の新規追加はありませんでした）", "gray"));
  } else {
    for (const tag of MEDIA_TAGS) {
      const matching = added.filter((p) => p.mediaTags.includes(tag));
      if (matching.length === 0) continue;
      const icon = MEDIA_ICONS[tag] ?? "▫️";
      blocks.push(heading(3, `${icon} ${tag} から (${matching.length} 社)`));
      for (const p of matching) blocks.push(bullet(p));
    }
    const noTag = added.filter((p) => p.mediaTags.length === 0);
    if (noTag.length > 0) {
      blocks.push(heading(3, `▫️ 媒体タグなし (${noTag.length} 社)`));
      for (const p of noTag) blocks.push(bullet(p));
    }
  }
  blocks.push(divider());

  blocks.push(heading(2, "♻️ ステータスが更新された会社"));
  if (updated.length === 0) {
    blocks.push(paragraph("（今月のステータス更新はありませんでした）", "gray"));
  } else {
    for (const tag of MEDIA_TAGS) {
      const matching = updated.filter((p) => p.mediaTags.includes(tag));
      if (matching.length === 0) continue;
      const icon = MEDIA_ICONS[tag] ?? "▫️";
      blocks.push(heading(3, `${icon} ${tag} (${matching.length} 社)`));
      for (const p of matching) blocks.push(bullet(p));
    }
  }
  blocks.push(divider());

  blocks.push(heading(2, `⏰ タイムアウトで「ご縁がなかった」へ移行 (${timedOut.length} 社)`));
  if (timedOut.length === 0) {
    blocks.push(paragraph(`（今月の自動タイムアウト移行はありませんでした）`, "gray"));
  } else {
    blocks.push(paragraph(`${TIMEOUT_DAYS}日以上反応がなかった会社が D:ご縁がなかった に自動移行されました。`, "gray"));
    for (const p of timedOut) blocks.push(bullet(p));
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

  const currentYear = String(start.getFullYear());
  const added = pages.filter((p) => p.createdAt >= start && p.createdAt < end);
  const updated = pages.filter(
    (p) =>
      !(p.createdAt >= start && p.createdAt < end) &&
      p.contactYears.includes(currentYear)
  );

  const timeoutMs = TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
  const timedOut = pages.filter((p) => {
    if (p.status !== STATUS_D) return false;
    if (!(p.lastEditedAt >= start && p.lastEditedAt < end)) return false;
    if (!(p.createdAt < p.lastEditedAt)) return false;
    if (!p.lastContactAt) return false;
    return p.lastEditedAt.getTime() - p.lastContactAt.getTime() >= timeoutMs;
  });

  const mediaCounts: Record<string, number> = {};
  for (const tag of MEDIA_TAGS) {
    mediaCounts[tag] = pages.filter((p) => p.mediaTags.includes(tag)).length;
  }
  const totalForMedia = Object.values(mediaCounts).reduce((a, b) => a + b, 0);

  console.log(`  新しく追加された会社: ${added.length}`);
  console.log(`  ステータスが更新された会社: ${updated.length}`);
  console.log(`  タイムアウトで D に移行（推定）: ${timedOut.length}`);
  console.log(`  媒体内訳:`, mediaCounts);

  const allBlocks = buildBlocks({ added, updated, timedOut, start, end, mediaCounts, totalForMedia });
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
      "Wantedly件数": { number: mediaCounts["Wantedly"] ?? 0 },
      "Green件数": { number: mediaCounts["Green"] ?? 0 },
      "直メール/フォーム件数": { number: mediaCounts["直メール/フォーム"] ?? 0 },
      "SNS件数": { number: mediaCounts["SNS"] ?? 0 },
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

  await notifyMention(notion, {
    title: `📊 ${label} を公開しました`,
    summary: `新しく追加された会社: ${added.length} 社、ステータスが更新された会社: ${updated.length} 社`,
    linkUrl: created.url,
    linkLabel: "▶ レポートを開く",
  });
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
