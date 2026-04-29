import type { RawMessage, ClassifiedMessage, Source } from "./types.js";

const COMMON_FREE_DOMAINS = new Set([
  "gmail.com",
  "yahoo.co.jp",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "me.com",
  "live.jp",
  "live.com",
]);

const NOREPLY_DOMAINS = new Set([
  "wantedly.com",
  "green-japan.com",
  "greenjapan.com",
  "indeed.com",
  "rikunabi.com",
  "mynavi.jp",
]);

export function extractCompanyDomain(msg: RawMessage): string {
  if (msg.isOutgoing) return msg.fromDomain;
  if (NOREPLY_DOMAINS.has(msg.fromDomain)) {
    const fromBody = extractDomainFromText(msg.snippet);
    if (fromBody) return fromBody;
  }
  if (COMMON_FREE_DOMAINS.has(msg.fromDomain)) {
    const fromBody = extractDomainFromText(msg.snippet);
    if (fromBody) return fromBody;
  }
  return msg.fromDomain;
}

function extractDomainFromText(text: string): string | null {
  const match = text.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (!match || !match[1]) return null;
  return match[1].toLowerCase().replace(/^www\./, "");
}

export function extractCompanyName(msg: RawMessage, domain: string): string {
  if (msg.fromName && !msg.fromName.includes("@")) {
    const cleaned = msg.fromName
      .replace(/<.+?>/g, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (cleaned && cleaned.length <= 50) return cleaned;
  }
  const sld = domain.split(".")[0];
  return sld ?? domain;
}

export function buildCompanyUrl(domain: string): string {
  return `https://${domain}/`;
}

export function classifyMessage(
  msg: RawMessage,
  source: Source
): ClassifiedMessage {
  const companyDomain = extractCompanyDomain(msg);
  const companyName = extractCompanyName(msg, companyDomain);
  const companyUrl = buildCompanyUrl(companyDomain);
  return {
    ...msg,
    sourceTag: source.tag,
    companyName,
    companyDomain,
    companyUrl,
  };
}
