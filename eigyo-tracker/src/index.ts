import "dotenv/config";
import { loadSources } from "./sources.js";
import { buildGmailClient, fetchMessages, getMyEmail } from "./gmail.js";
import {
  addCompany,
  buildNotionClient,
  fetchAllCompanies,
  findCompany,
  getCompaniesDbId,
  updateCompany,
  updateCompanyStatus,
  updateLastContact,
} from "./notion.js";
import { classifyMessage, shouldSkipDomain } from "./classify.js";
import { reportUnclassifiedCandidates } from "./learn.js";
import { notifyMention, type NotifyEntry } from "./notify.js";
import { detectStatusFromMessage, shouldUpdate as shouldUpdateStatus } from "./status.js";
import type { SyncStats } from "./types.js";

async function main() {
  const startedAt = new Date();
  console.log(`[eigyo-tracker] start: ${startedAt.toISOString()}`);

  const sources = loadSources();
  console.log(`[eigyo-tracker] enabled sources: ${sources.map((s) => s.name).join(", ")}`);

  const lookbackDays = Number(process.env.SYNC_LOOKBACK_DAYS ?? "2");
  const stats: SyncStats = {
    fetched: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  const gmail = buildGmailClient();
  const myEmail = await getMyEmail(gmail);
  console.log(`[eigyo-tracker] mailbox: ${myEmail}`);

  const notion = buildNotionClient();
  const dbId = getCompaniesDbId();
  const companies = await fetchAllCompanies(notion, dbId);
  console.log(`[eigyo-tracker] existing companies: ${companies.length}`);

  const year = String(startedAt.getFullYear());
  const seenIds = new Set<string>();
  const addedEntries: NotifyEntry[] = [];
  const updatedEntries: NotifyEntry[] = [];
  const skippedEntries: NotifyEntry[] = [];
  const statusChanges: Array<{ name: string; from: string | null; to: string; reason: string; matchedKeyword: string }> = [];

  for (const source of sources) {
    console.log(`\n[${source.name}] query: ${source.query}`);
    let messages;
    try {
      messages = await fetchMessages(gmail, source.query, lookbackDays, myEmail, {
        withBody: source.fetchBody === true,
      });
    } catch (err: any) {
      console.error(`[${source.name}] fetch error:`, err?.message ?? err);
      stats.errors++;
      stats.errorDetails.push(`${source.name}: ${err?.message ?? err}`);
      continue;
    }
    console.log(`[${source.name}] fetched ${messages.length} message(s)`);
    stats.fetched += messages.length;

    for (const msg of messages) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);

      const classified = classifyMessage(msg, source);

      if (shouldSkipDomain(classified.companyDomain)) {
        stats.skipped++;
        continue;
      }

      try {
        const existing = findCompany(
          companies,
          classified.companyDomain,
          classified.companyName
        );
        const detection = detectStatusFromMessage(msg);

        if (existing) {
          if (!existing.lastContactAt || msg.date > existing.lastContactAt) {
            try {
              await updateLastContact(notion, existing.pageId, msg.date);
              existing.lastContactAt = msg.date;
            } catch (err: any) {
              console.error(`  lastContact update error: ${existing.name}: ${err?.message ?? err}`);
            }
          }
          if (detection && shouldUpdateStatus(existing.status, detection.status)) {
            try {
              await updateCompanyStatus(notion, existing.pageId, detection.status);
              statusChanges.push({
                name: existing.name,
                from: existing.status,
                to: detection.status,
                reason: detection.reason,
                matchedKeyword: detection.matchedKeyword,
              });
              existing.status = detection.status;
              console.log(`  status: ${existing.name}  ${existing.status ?? "(未設定)"} → ${detection.status}  [${detection.matchedKeyword}]`);
            } catch (err: any) {
              console.error(`  status update error: ${existing.name}: ${err?.message ?? err}`);
            }
          }
          const updated = await updateCompany(notion, existing, year, source.tag);
          if (updated) {
            existing.contactYears = Array.from(
              new Set([...existing.contactYears, year])
            );
            existing.mediaTags = Array.from(
              new Set([...existing.mediaTags, source.tag])
            );
            updatedEntries.push({ name: existing.name, url: existing.url, mediaTag: source.tag });
            stats.updated++;
            console.log(`  updated: ${existing.name} (${classified.companyDomain})`);
          } else {
            skippedEntries.push({ name: existing.name, url: existing.url, mediaTag: source.tag });
            stats.skipped++;
          }
        } else {
          const initialStatus = detection?.status ?? "待機中";
          await addCompany(notion, dbId, {
            name: classified.companyName,
            url: classified.companyUrl,
            year,
            mediaTag: source.tag,
            status: initialStatus,
            lastContactAt: msg.date,
          });
          companies.push({
            pageId: "",
            name: classified.companyName,
            url: classified.companyUrl,
            contactYears: [year],
            mediaTags: [source.tag],
            status: initialStatus,
            lastContactAt: msg.date,
          });
          if (detection) {
            statusChanges.push({
              name: classified.companyName,
              from: null,
              to: detection.status,
              reason: detection.reason,
              matchedKeyword: detection.matchedKeyword,
            });
          }
          addedEntries.push({
            name: classified.companyName,
            url: classified.companyUrl,
            mediaTag: source.tag,
          });
          stats.added++;
          console.log(`  added: ${classified.companyName} (${classified.companyDomain})`);
        }
      } catch (err: any) {
        stats.errors++;
        const detail = `${classified.companyName}: ${err?.message ?? err}`;
        stats.errorDetails.push(detail);
        console.error(`  error: ${detail}`);
      }
    }
  }

  await reportUnclassifiedCandidates(gmail, myEmail, seenIds, lookbackDays);

  const forceNotify = process.env.FORCE_NOTIFY === "1";
  const hasChanges = addedEntries.length > 0 || updatedEntries.length > 0 || statusChanges.length > 0;
  if (hasChanges || forceNotify) {
    const allEntries = [...addedEntries, ...updatedEntries];
    if (forceNotify && allEntries.length === 0) {
      allEntries.push(...skippedEntries);
    }
    const statusLines = statusChanges.length > 0
      ? `\n\n⚡ ステータス自動更新: ${statusChanges.length}件\n` +
        statusChanges
          .slice(0, 10)
          .map((s) => `• ${s.name}: ${s.from ?? "(未設定)"} → ${s.to}（${s.matchedKeyword}）`)
          .join("\n")
      : "";
    const summary = forceNotify
      ? `過去${lookbackDays}日でメール${stats.fetched}件を確認 → 新規${stats.added}社、更新${stats.updated}社、変更なし${stats.skipped}社${statusLines}`
      : `今回の同期で新規${stats.added}社、更新${stats.updated}社が反映されました。${statusLines}`;
    await notifyMention(notion, {
      title: addedEntries.length > 0
        ? `🆕 営業同期: 新規${stats.added}社追加`
        : statusChanges.length > 0
          ? `⚡ 営業同期: ${statusChanges.length}社のステータス自動更新`
          : `📬 営業同期: ${stats.updated}社の媒体タグ更新`,
      summary,
      entries: allEntries.slice(0, 30),
    });
  }

  const finishedAt = new Date();
  const duration = (finishedAt.getTime() - startedAt.getTime()) / 1000;
  console.log(
    `\n[eigyo-tracker] done in ${duration.toFixed(1)}s — fetched=${stats.fetched} added=${stats.added} updated=${stats.updated} skipped=${stats.skipped} errors=${stats.errors}`
  );
  if (stats.errorDetails.length) {
    console.log(`[eigyo-tracker] error details:\n${stats.errorDetails.join("\n")}`);
  }
}

main().catch((err) => {
  console.error("[eigyo-tracker] fatal:", err);
  process.exit(1);
});
