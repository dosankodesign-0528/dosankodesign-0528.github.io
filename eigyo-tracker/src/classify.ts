import type { RawMessage, ClassifiedMessage, Source } from "./types.js";

export const COMMON_FREE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.co.jp",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "live.jp",
  "live.com",
  "ymobile.ne.jp",
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "softbank.ne.jp",
  "i.softbank.jp",
  "au.com",
  "ymail.ne.jp",
  "nifty.com",
  "biglobe.ne.jp",
  "so-net.ne.jp",
]);

export const ATS_DOMAINS = new Set([
  "candidacy.herp.cloud",
  "herp.cloud",
  "hrmos.co",
  "recruiterbox.com",
  "lever.co",
  "greenhouse.io",
  "workday.com",
  "smartrecruiters.com",
]);

export const NOREPLY_DOMAINS = new Set([
  "wantedly.com",
  "green-japan.com",
  "greenjapan.com",
  "indeed.com",
  "rikunabi.com",
  "mynavi.jp",
  "doda.jp",
  ...ATS_DOMAINS,
]);

const SUBJECT_NOISE_PATTERN = /^(re:|fwd?:|お問い合わせ|お問合せ|お問い合せ|問い合わせ|書類選考|選考結果|ご応募|応募|採用|スカウト|業務委託|ご依頼|ご提案|秘密保持|重要|【|\[)/i;

export function extractCompanyDomain(msg: RawMessage): string {
  if (msg.isOutgoing) return msg.fromDomain;
  if (NOREPLY_DOMAINS.has(msg.fromDomain) || COMMON_FREE_DOMAINS.has(msg.fromDomain)) {
    const fromBody = extractDomainFromText(msg.snippet);
    if (fromBody) return fromBody;
  }
  return msg.fromDomain;
}

function extractDomainFromText(text: string): string | null {
  const match = text.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (!match || !match[1]) return null;
  const domain = match[1].toLowerCase().replace(/^www\./, "");
  if (COMMON_FREE_DOMAINS.has(domain) || ATS_DOMAINS.has(domain) || NOREPLY_DOMAINS.has(domain)) {
    return null;
  }
  return domain;
}

export function extractCompanyNameFromSubject(subject: string): string | null {
  const bracketMatches = subject.match(/【([^】]+?)】|\[([^\]]+?)\]/g);
  if (bracketMatches) {
    for (const m of bracketMatches) {
      const inner = m.replace(/^[【\[]|[】\]]$/g, "").trim();
      if (inner.length < 2 || inner.length > 40) continue;
      if (SUBJECT_NOISE_PATTERN.test(inner)) continue;
      if (/[株式会社\(株\)（株）有限会社合同会社]/.test(inner) || /[A-Za-z]/.test(inner)) {
        return inner;
      }
    }
  }
  const corpMatch = subject.match(/(株式会社[一-龯぀-ゟ゠-ヿA-Za-z0-9・\s]{1,20}|[一-龯぀-ゟ゠-ヿA-Za-z0-9・\s]{1,20}株式会社)/);
  if (corpMatch && corpMatch[1]) return corpMatch[1].trim();
  return null;
}

export function extractCompanyName(msg: RawMessage, domain: string): string {
  const fromSubject = extractCompanyNameFromSubject(msg.subject);
  if (fromSubject) return fromSubject;
  if (msg.fromName && !msg.fromName.includes("@")) {
    const cleaned = msg.fromName
      .replace(/<.+?>/g, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (cleaned && cleaned.length <= 50 && cleaned !== "gmail" && cleaned !== "Gmail") {
      return cleaned;
    }
  }
  const sld = domain.split(".")[0];
  return sld ?? domain;
}

export function buildCompanyUrl(domain: string): string {
  return `https://${domain}/`;
}

export function shouldSkipDomain(domain: string): boolean {
  if (!domain || domain.length < 3) return true;
  if (COMMON_FREE_DOMAINS.has(domain)) return true;
  if (ATS_DOMAINS.has(domain)) return true;
  return false;
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
