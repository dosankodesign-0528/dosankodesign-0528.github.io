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
} from "./notion.js";
import { classifyMessage } from "./classify.js";
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

  for (const source of sources) {
    console.log(`\n[${source.name}] query: ${source.query}`);
    let messages;
    try {
      messages = await fetchMessages(gmail, source.query, lookbackDays, myEmail);
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

      if (!classified.companyDomain || classified.companyDomain.length < 3) {
        stats.skipped++;
        continue;
      }

      try {
        const existing = findCompany(
          companies,
          classified.companyDomain,
          classified.companyName
        );
        if (existing) {
          const updated = await updateCompany(notion, existing, year, source.tag);
          if (updated) {
            existing.contactYears = Array.from(
              new Set([...existing.contactYears, year])
            );
            existing.mediaTags = Array.from(
              new Set([...existing.mediaTags, source.tag])
            );
            stats.updated++;
            console.log(`  updated: ${existing.name} (${classified.companyDomain})`);
          } else {
            stats.skipped++;
          }
        } else {
          await addCompany(notion, dbId, {
            name: classified.companyName,
            url: classified.companyUrl,
            year,
            mediaTag: source.tag,
          });
          companies.push({
            pageId: "",
            name: classified.companyName,
            url: classified.companyUrl,
            contactYears: [year],
            mediaTags: [source.tag],
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
