import "dotenv/config";
import { loadSources } from "./sources.js";
import { buildGmailClient, fetchMessages, getMyEmail } from "./gmail.js";
import {
  addCompany,
  addStatusChangeLog,
  buildNotionClient,
  fetchAllCompanies,
  findCompany,
  getCompaniesDbId,
  getStatusChangeLogDbId,
  syncLastKnownStatus,
  updateCompany,
  updateCompanyStatus,
  updateLastContact,
} from "./notion.js";
import { classifyMessage, shouldSkipDomain } from "./classify.js";
import { reportUnclassifiedCandidates } from "./learn.js";
import { notifyMention, type NotifyEntry } from "./notify.js";
import { assertSchemaOrFail } from "./schema-check.js";
import { resolveSchema, type StatusOptionKey } from "./schema-resolver.js";
import { selfHealSchema } from "./schema-restorer.js";
import {
  detectStatusFromMessage,
  isManualReviewCandidate,
  shouldUpdate as shouldUpdateStatus,
} from "./status.js";
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
  const statusLogDbId = getStatusChangeLogDbId();

  // Notion 側で rename / 追加されたら id 経由で追従、削除/オプション欠落は自動復元、
  // 型変更だけはデータロス回避のため停止＆通知。
  const initialSchema = await resolveSchema(notion, dbId, statusLogDbId);
  const schema = await selfHealSchema(notion, initialSchema, dbId, statusLogDbId);
  await assertSchemaOrFail(notion, schema);
  const compSchema = schema.companies;
  const logSchema = schema.statusLog;

  const companies = await fetchAllCompanies(notion, dbId, schema);
  console.log(`[eigyo-tracker] existing companies: ${companies.length}`);

  // Phase 2: Notion 上での手動ステータス編集を検知
  // ステータス !== lastKnownStatus なら、前回 sync 以降に Notion で人間が編集したと判定
  // - 初期化（lastKnownStatus 空）の会社はスキップ → init-last-known-status.ts を別途実行する想定
  // - 全会社の初期化を毎sync でやると timeout するため
  const manualChanges: Array<{ name: string; from: string | null; to: string; url: string | null; mediaTags: string[] }> = [];
  let uninitialized = 0;
  if (statusLogDbId) {
    for (const c of companies) {
      if (!c.statusKey) continue;
      if (!c.lastKnownStatusKey) {
        uninitialized++;
        continue;
      }
      if (c.statusKey !== c.lastKnownStatusKey) {
        try {
          await addStatusChangeLog(notion, statusLogDbId, logSchema, {
            companyName: c.name,
            companyPageId: c.pageId,
            beforeKey: c.lastKnownStatusKey,
            afterKey: c.statusKey,
            mediaTags: c.mediaTags,
            category: "手動変更",
            evidence: "Notion上での手動編集を検知（前回 sync 以降にステータスが変更されていた）",
          });
          await syncLastKnownStatus(notion, compSchema, c.pageId, c.statusKey);
          manualChanges.push({
            name: c.name,
            from: c.lastKnownStatus,
            to: c.status ?? "",
            url: c.url,
            mediaTags: c.mediaTags,
          });
          const beforeStatus = c.lastKnownStatus;
          c.lastKnownStatus = c.status;
          c.lastKnownStatusKey = c.statusKey;
          console.log(`  📝 手動変更検知: ${c.name}  ${beforeStatus} → ${c.status}`);
        } catch (err: any) {
          console.error(`  manual-change log error: ${c.name}: ${err?.message ?? err}`);
        }
      }
    }
    console.log(`[eigyo-tracker] 手動編集検知: ${manualChanges.length} 件`);
    if (uninitialized > 0) {
      console.warn(
        `[eigyo-tracker] ⚠️ 前回ステータス未初期化: ${uninitialized} 社（init-last-known-status.ts を実行してください）`
      );
    }
  }

  const year = String(startedAt.getFullYear());
  const seenIds = new Set<string>();
  const addedEntries: NotifyEntry[] = [];
  const updatedEntries: NotifyEntry[] = [];
  const skippedEntries: NotifyEntry[] = [];
  const statusChanges: Array<{ name: string; from: string | null; to: string; reason: string; matchedKeyword: string }> = [];
  const skipCandidates: Array<{ name: string; current: string | null; suggested: string; reason: string; matchedKeyword: string; url: string | null }> = [];

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
              await updateLastContact(notion, compSchema, existing.pageId, msg.date);
              existing.lastContactAt = msg.date;
            } catch (err: any) {
              console.error(`  lastContact update error: ${existing.name}: ${err?.message ?? err}`);
            }
          }
          if (detection && shouldUpdateStatus(existing.statusKey, detection)) {
            try {
              const beforeStatus = existing.status;
              const beforeKey = existing.statusKey;
              const afterName = compSchema.statusOptions[detection.statusKey];
              await updateCompanyStatus(notion, compSchema, existing.pageId, detection.statusKey);
              statusChanges.push({
                name: existing.name,
                from: beforeStatus,
                to: afterName,
                reason: detection.reason,
                matchedKeyword: detection.matchedKeyword,
              });
              existing.status = afterName;
              existing.statusKey = detection.statusKey;
              console.log(`  status: ${existing.name}  ${beforeStatus ?? "(未設定)"} → ${afterName}  [${detection.matchedKeyword}]`);
              if (statusLogDbId) {
                try {
                  await addStatusChangeLog(notion, statusLogDbId, logSchema, {
                    companyName: existing.name,
                    companyPageId: existing.pageId,
                    beforeKey,
                    afterKey: detection.statusKey,
                    mediaTags: existing.mediaTags,
                    category: "自動検知",
                    evidence: `${detection.reason}「${detection.matchedKeyword}」`,
                  });
                } catch (logErr: any) {
                  console.error(`  status-log write error: ${existing.name}: ${logErr?.message ?? logErr}`);
                }
              }
            } catch (err: any) {
              console.error(`  status update error: ${existing.name}: ${err?.message ?? err}`);
            }
          } else if (detection && isManualReviewCandidate(existing.statusKey, detection)) {
            const suggestedName = compSchema.statusOptions[detection.statusKey];
            skipCandidates.push({
              name: existing.name,
              current: existing.status,
              suggested: suggestedName,
              reason: detection.reason,
              matchedKeyword: detection.matchedKeyword,
              url: existing.url,
            });
            console.log(`  ⚠️ skip候補: ${existing.name}  ${existing.status ?? "(未設定)"} → ${suggestedName}（${detection.reason}「${detection.matchedKeyword}」）`);
          }
          const updated = await updateCompany(notion, compSchema, existing, year, source.tag);
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
          const initialKey: StatusOptionKey = detection?.statusKey ?? "WAITING";
          const initialName = compSchema.statusOptions[initialKey];
          await addCompany(notion, dbId, compSchema, {
            name: classified.companyName,
            url: classified.companyUrl,
            year,
            mediaTag: source.tag,
            statusKey: initialKey,
            lastContactAt: msg.date,
          });
          companies.push({
            pageId: "",
            name: classified.companyName,
            url: classified.companyUrl,
            contactYears: [year],
            mediaTags: [source.tag],
            status: initialName,
            statusKey: initialKey,
            lastContactAt: msg.date,
            lastKnownStatus: initialKey,
            lastKnownStatusKey: initialKey,
          });
          if (detection) {
            statusChanges.push({
              name: classified.companyName,
              from: null,
              to: initialName,
              reason: detection.reason,
              matchedKeyword: detection.matchedKeyword,
            });
            if (statusLogDbId) {
              try {
                await addStatusChangeLog(notion, statusLogDbId, logSchema, {
                  companyName: classified.companyName,
                  beforeKey: null,
                  afterKey: detection.statusKey,
                  mediaTags: [source.tag],
                  category: "新規追加",
                  evidence: `新規追加（${detection.reason}「${detection.matchedKeyword}」）`,
                });
              } catch (logErr: any) {
                console.error(`  status-log write error: ${classified.companyName}: ${logErr?.message ?? logErr}`);
              }
            }
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

  // 段飛ばし候補・降格候補は別通知（人間の手動アクション要求なので埋もれないように）
  if (skipCandidates.length > 0) {
    const candidateLines = skipCandidates
      .slice(0, 15)
      .map((c) => `• ${c.name}: 現状【${c.current ?? "(未設定)"}】→ 検知【${c.suggested}】（${c.reason}「${c.matchedKeyword}」）`)
      .join("\n");
    const more = skipCandidates.length > 15 ? `\n…他 ${skipCandidates.length - 15} 件` : "";
    await notifyMention(notion, {
      title: `⚠️ 段飛ばし／降格候補: ${skipCandidates.length}件 — 手動確認推奨`,
      summary: `自動更新条件を満たさないが、進行 or 降格シグナルを検知した会社です。Notionで手動更新するかどうか判断してください。\n\n${candidateLines}${more}`,
      entries: skipCandidates.slice(0, 30).map((c) => ({ name: c.name, url: c.url, mediaTag: `${c.current ?? "(未設定)"} → ${c.suggested}` })),
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
