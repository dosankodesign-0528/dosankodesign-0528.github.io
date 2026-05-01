import "dotenv/config";
import {
  addStatusChangeLog,
  buildNotionClient,
  fetchAllCompanies,
  getCompaniesDbId,
  getStatusChangeLogDbId,
  updateCompanyStatus,
} from "./notion.js";
import { notifyMention, type NotifyEntry } from "./notify.js";
import { STATUS } from "./status.js";

const TIMEOUT_DAYS = Number(process.env.TIMEOUT_DAYS ?? "14");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NOTIFICATION_ONLY_TAGS = new Set(["Wantedly", "Green"]);
const REAL_CONTACT_TAGS = new Set(["直メール/フォーム", "SNS"]);

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

function isNotificationOnly(mediaTags: string[]): boolean {
  if (mediaTags.length === 0) return false;
  if (mediaTags.some((t) => REAL_CONTACT_TAGS.has(t))) return false;
  return mediaTags.every((t) => NOTIFICATION_ONLY_TAGS.has(t));
}

async function main() {
  console.log(`[timeout] start: ${new Date().toISOString()}`);
  console.log(`[timeout] threshold: ${TIMEOUT_DAYS} 日`);

  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const statusLogDbId = getStatusChangeLogDbId();
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`[timeout] 全企業: ${companies.length} 社`);

  const candidates = companies.filter((c) => {
    if (c.status !== STATUS.WAITING) return false;
    if (!c.lastContactAt) return false;
    return daysSince(c.lastContactAt) >= TIMEOUT_DAYS;
  });
  const targets = candidates.filter((c) => !isNotificationOnly(c.mediaTags));
  const skippedNotifOnly = candidates.length - targets.length;
  console.log(`[timeout] 待機中・${TIMEOUT_DAYS}日以上前接触: ${candidates.length} 社`);
  console.log(`[timeout]   うち通知系のみ（Wantedly/Green）でスキップ: ${skippedNotifOnly} 社`);
  console.log(`[timeout]   実際のタイムアウト対象: ${targets.length} 社`);

  if (targets.length === 0) {
    console.log("[timeout] タイムアウト対象なし");
    return;
  }

  let moved = 0;
  const movedEntries: NotifyEntry[] = [];
  for (const t of targets) {
    try {
      await updateCompanyStatus(notion, t.pageId, STATUS.D);
      moved++;
      const days = Math.floor(daysSince(t.lastContactAt!));
      console.log(`  ↘ ${t.name}: 待機中 → D:ご縁がなかった（${days}日経過）`);
      movedEntries.push({
        name: t.name,
        url: t.url,
        mediaTag: `${days}日経過`,
      });
      if (statusLogDbId) {
        try {
          await addStatusChangeLog(notion, statusLogDbId, {
            companyName: t.name,
            companyPageId: t.pageId,
            before: STATUS.WAITING,
            after: STATUS.D,
            mediaTags: t.mediaTags,
            category: "タイムアウト",
            evidence: `${TIMEOUT_DAYS}日以上反応なし（${days}日経過）→ 自動でDへ移行`,
          });
        } catch (logErr: any) {
          console.error(`  status-log write error: ${t.name}: ${logErr?.message ?? logErr}`);
        }
      }
    } catch (err: any) {
      console.error(`  error: ${t.name}: ${err?.message ?? err}`);
    }
    await sleep(250);
  }

  console.log(`[timeout] ✅ ${moved} 社を D:ご縁がなかった に移行しました`);

  if (moved > 0) {
    await notifyMention(notion, {
      title: `⏰ タイムアウト処理: ${moved}社を「ご縁がなかった」へ`,
      summary: `${TIMEOUT_DAYS}日以上反応がなかった「待機中」の企業を D:ご縁がなかった に自動移行しました。`,
      entries: movedEntries.slice(0, 30),
    });
  }
}

main().catch((err) => {
  console.error(err?.body ?? err);
  process.exit(1);
});
