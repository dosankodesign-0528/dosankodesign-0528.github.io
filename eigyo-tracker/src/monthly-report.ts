import "dotenv/config";
import { Client } from "@notionhq/client";
import {
  buildNotionClient,
  fetchStatusChangesInRange,
  getCompaniesDbId,
  getStatusChangeLogDbId,
  type StatusChangeLog,
} from "./notion.js";
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

const STATUS_AFTER_EMOJI: Record<string, string> = {
  "S:継続中": "🌟",
  "A：取引あり": "✨",
  "B：パートナー契約": "🤝",
  "C：やりとりあり": "💬",
  "D:ご縁がなかった": "☁️",
  待機中: "⏳",
};

const MEDAL_EMOJI = ["🥇", "🥈", "🥉", "🏅"];
const MEDAL_COLOR = ["orange_background", "blue_background", "green_background", "gray_background"];

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
      const mediaProp = props["営業した媒体"];
      const mediaTags = mediaProp?.type === "multi_select"
        ? (mediaProp.multi_select ?? []).map((m: any) => m.name as string)
        : [];
      const contactProp = props["連絡日時"];
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

// Pattern γ: 媒体ごとに会社一覧をトグルで折りたたむ
function toggleGroup(label: string, children: any[]): any {
  return {
    object: "block",
    type: "toggle",
    toggle: {
      rich_text: [
        { type: "text", text: { content: label }, annotations: { bold: true } },
      ],
      color: "default",
      children,
    },
  };
}

// Pattern E: 媒体別の内訳をメダル順カード型で表示
function mediaBreakdownBlocks(
  mediaCounts: Record<string, number>,
  totalForMedia: number
): any[] {
  if (totalForMedia === 0) {
    return [paragraph("（媒体別のデータはまだありません）", "gray")];
  }
  const sorted = MEDIA_TAGS
    .map((tag) => ({
      tag,
      count: mediaCounts[tag] ?? 0,
      ratio: (mediaCounts[tag] ?? 0) / totalForMedia,
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.map((m, i) => {
    const medal = MEDAL_EMOJI[i] ?? "🏅";
    const color = MEDAL_COLOR[i] ?? "gray_background";
    const icon = MEDIA_ICONS[m.tag] ?? "▫️";
    const percent = (m.ratio * 100).toFixed(0);
    return {
      object: "block",
      type: "callout",
      callout: {
        icon: { type: "emoji", emoji: medal },
        color,
        rich_text: [
          {
            type: "text",
            text: { content: `${icon} ${m.tag}  ─  ${m.count} 社（${percent}%）` },
            annotations: { bold: true },
          },
        ],
      },
    };
  });
}

// Pattern β: ステータス更新を「会社 / Before / After / 判定根拠」テーブルで表示
// Before: コードブロック書体（過去・参照）
// After:  太字＋絵文字（決定事項・現在）
// 判定根拠: 種別バッジ + 根拠テキスト（自動検知/手動変更/タイムアウト/新規追加 を区別）
const CATEGORY_EMOJI: Record<string, string> = {
  自動検知: "🤖",
  手動変更: "✋",
  タイムアウト: "⏰",
  新規追加: "🆕",
};

function statusChangeTable(changes: StatusChangeLog[]): any[] {
  if (changes.length === 0) return [];
  const headerRow = {
    type: "table_row",
    table_row: {
      cells: [
        [{ type: "text", text: { content: "会社" }, annotations: { bold: true } }],
        [{ type: "text", text: { content: "Before" }, annotations: { bold: true } }],
        [{ type: "text", text: { content: "After" }, annotations: { bold: true } }],
        [{ type: "text", text: { content: "判定根拠" }, annotations: { bold: true } }],
      ],
    },
  };
  const dataRows = changes.map((c) => {
    const companyCell = c.companyPageId
      ? [{ type: "mention", mention: { type: "page", page: { id: c.companyPageId } } }]
      : [{ type: "text", text: { content: c.companyName } }];
    const beforeCell = [
      {
        type: "text",
        text: { content: c.before ?? "(新規)" },
        annotations: { code: true },
      },
    ];
    const afterEmoji = STATUS_AFTER_EMOJI[c.after] ?? "✨";
    const afterCell = [
      {
        type: "text",
        text: { content: c.after },
        annotations: { bold: true },
      },
      { type: "text", text: { content: ` ${afterEmoji}` } },
    ];
    const categoryEmoji = c.category ? (CATEGORY_EMOJI[c.category] ?? "") : "";
    const categoryLabel = c.category ?? "(不明)";
    const evidenceCell: any[] = [
      {
        type: "text",
        text: { content: `${categoryEmoji} ${categoryLabel}` },
        annotations: { bold: true, color: c.category === "自動検知" ? "blue" : c.category === "タイムアウト" ? "orange" : c.category === "新規追加" ? "default" : "gray" },
      },
    ];
    if (c.evidence) {
      evidenceCell.push({ type: "text", text: { content: ` — ${c.evidence}` } });
    }
    return {
      type: "table_row",
      table_row: { cells: [companyCell, beforeCell, afterCell, evidenceCell] },
    };
  });
  return [
    {
      object: "block",
      type: "table",
      table: {
        table_width: 4,
        has_column_header: true,
        has_row_header: false,
        children: [headerRow, ...dataRows],
      },
    },
  ];
}

function buildBlocks(args: {
  added: PageInfo[];
  statusChanges: StatusChangeLog[];
  timedOut: PageInfo[];
  start: Date;
  end: Date;
  mediaCounts: Record<string, number>;
  totalForMedia: number;
  hasStatusLogDb: boolean;
}): any[] {
  const blocks: any[] = [];
  const { added, statusChanges, timedOut, start, end, mediaCounts, totalForMedia, hasStatusLogDb } = args;

  const days = process.env.REPORT_DAYS ? Number(process.env.REPORT_DAYS) : 0;
  const periodLabel = days > 0 ? `直近${days}日間で` : `${start.getFullYear()}年${start.getMonth() + 1}月は、`;
  const periodNoun = days > 0 ? `この${days}日間` : "今月";
  const mainSentence = added.length > 0
    ? `${periodLabel}新しく ${added.length} 社が追加されました。ステータスが更新された会社は ${statusChanges.length} 社です。`
    : `${periodLabel}新しく追加された会社はありませんでした。ステータスが更新された会社は ${statusChanges.length} 社です。`;
  blocks.push(callout(mainSentence, "💡"));

  blocks.push(paragraph(`期間: ${formatJapaneseDate(start)} 〜 ${formatJapaneseDate(new Date(end.getTime() - 1))}`, "gray"));
  blocks.push(divider());

  blocks.push(heading(2, `📈 ${periodNoun}の動き`));
  blocks.push(paragraph(`🆕 新しく追加された会社        ${added.length} 社`));
  blocks.push(paragraph(`♻️ ステータスが更新された会社  ${statusChanges.length} 社`));
  blocks.push(paragraph(`⏰ タイムアウト（${TIMEOUT_DAYS}日反応なし→D）  ${timedOut.length} 社`));
  blocks.push(divider());

  blocks.push(heading(2, "🎯 どこから来たか（媒体別の内訳）"));
  blocks.push(...mediaBreakdownBlocks(mediaCounts, totalForMedia));
  blocks.push(divider());

  blocks.push(heading(2, "🆕 新しく追加された会社"));
  if (added.length === 0) {
    blocks.push(paragraph(`（${periodNoun}の新規追加はありませんでした）`, "gray"));
  } else {
    blocks.push(paragraph("各媒体グループをクリックすると会社一覧が開きます。", "gray"));
    for (const tag of MEDIA_TAGS) {
      const matching = added.filter((p) => p.mediaTags.includes(tag));
      if (matching.length === 0) continue;
      const icon = MEDIA_ICONS[tag] ?? "▫️";
      blocks.push(toggleGroup(`${icon} ${tag} から (${matching.length} 社)`, matching.map((p) => bullet(p))));
    }
    const noTag = added.filter((p) => p.mediaTags.length === 0);
    if (noTag.length > 0) {
      blocks.push(toggleGroup(`▫️ 媒体タグなし (${noTag.length} 社)`, noTag.map((p) => bullet(p))));
    }
  }
  blocks.push(divider());

  blocks.push(heading(2, "♻️ ステータスが更新された会社"));
  if (!hasStatusLogDb) {
    blocks.push(
      callout(
        "ステータス変更ログDBが未設定のため、変更履歴は表示できません（NOTION_STATUS_CHANGE_LOG_DB_ID を設定してください）。",
        "⚠️",
        "yellow_background"
      )
    );
  } else if (statusChanges.length === 0) {
    blocks.push(paragraph(`（${periodNoun}のステータス更新はありませんでした）`, "gray"));
  } else {
    blocks.push(
      paragraph("Before は過去、After は新ステータスです。", "gray")
    );
    blocks.push(...statusChangeTable(statusChanges));
  }
  blocks.push(divider());

  blocks.push(heading(2, `⏰ タイムアウトで「ご縁がなかった」へ移行 (${timedOut.length} 社)`));
  if (timedOut.length === 0) {
    blocks.push(paragraph(`（${periodNoun}の自動タイムアウト移行はありませんでした）`, "gray"));
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
  const statusLogDbId = getStatusChangeLogDbId();

  const pages = await fetchPagesInRange(notion, companiesDbId, start, end);
  console.log(`[monthly-report] 期間内変更ページ: ${pages.length} 件`);

  const added = pages.filter((p) => p.createdAt >= start && p.createdAt < end);

  let statusChanges: StatusChangeLog[] = [];
  if (statusLogDbId) {
    try {
      statusChanges = await fetchStatusChangesInRange(notion, statusLogDbId, start, end);
      console.log(`[monthly-report] 変更ログ: ${statusChanges.length} 件`);
    } catch (err: any) {
      console.error(`[monthly-report] 変更ログ読込エラー: ${err?.message ?? err}`);
    }
  } else {
    console.log("[monthly-report] NOTION_STATUS_CHANGE_LOG_DB_ID 未設定 → ステータス変更ログはスキップ");
  }

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
  console.log(`  ステータスが更新された会社: ${statusChanges.length}`);
  console.log(`  タイムアウトで D に移行（推定）: ${timedOut.length}`);
  console.log(`  媒体内訳:`, mediaCounts);

  const allBlocks = buildBlocks({
    added,
    statusChanges,
    timedOut,
    start,
    end,
    mediaCounts,
    totalForMedia,
    hasStatusLogDb: !!statusLogDbId,
  });
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
      更新件数: { number: statusChanges.length },
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
    summary: `新しく追加された会社: ${added.length} 社、ステータスが更新された会社: ${statusChanges.length} 社`,
    linkUrl: created.url,
    linkLabel: "▶ レポートを開く",
  });
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
