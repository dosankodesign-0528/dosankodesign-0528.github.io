import type { Client } from "@notionhq/client";

export interface NotifyEntry {
  name: string;
  pageId?: string;
  url?: string | null;
  mediaTag?: string;
}

export async function notifyMention(
  notion: Client,
  args: {
    title: string;
    summary: string;
    entries?: NotifyEntry[];
    linkUrl?: string;
    linkLabel?: string;
  }
): Promise<void> {
  const userId = process.env.NOTION_USER_ID;
  const pageId = process.env.NOTION_NOTIFY_PAGE_ID;
  if (!userId || !pageId) {
    console.log("[notify] NOTION_USER_ID or NOTION_NOTIFY_PAGE_ID not set, skipping");
    return;
  }

  const richText: any[] = [
    { type: "mention", mention: { type: "user", user: { id: userId } } },
    { type: "text", text: { content: ` ${args.title}\n${args.summary}` } },
  ];

  if (args.entries && args.entries.length > 0) {
    const list = args.entries.slice(0, 15);
    const lines = list.map((e) => `\n• ${e.name}${e.mediaTag ? ` [${e.mediaTag}]` : ""}`).join("");
    const more = args.entries.length > list.length ? `\n…他 ${args.entries.length - list.length} 件` : "";
    richText.push({ type: "text", text: { content: `${lines}${more}` } });
  }

  if (args.linkUrl) {
    richText.push({
      type: "text",
      text: { content: `\n${args.linkLabel ?? "▶ 詳細を見る"}`, link: { url: args.linkUrl } },
    });
  }

  try {
    await (notion as any).comments.create({
      parent: { page_id: pageId },
      rich_text: richText,
    });
    console.log(`[notify] ✅ メンション通知を送信しました（${args.title}）`);
  } catch (err: any) {
    console.error("[notify] error:", err?.message ?? err);
  }
}
