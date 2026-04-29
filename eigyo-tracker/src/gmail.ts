import { google, gmail_v1 } from "googleapis";
import type { RawMessage } from "./types.js";

export function buildGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail credentials missing. Set GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN."
    );
  }
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth });
}

export async function fetchMessages(
  gmail: gmail_v1.Gmail,
  query: string,
  lookbackDays: number,
  myEmail: string
): Promise<RawMessage[]> {
  const fullQuery = `${query} newer_than:${lookbackDays}d`;
  const list = await gmail.users.messages.list({
    userId: "me",
    q: fullQuery,
    maxResults: 100,
  });
  const ids = (list.data.messages ?? []).map((m) => m.id).filter((x): x is string => !!x);
  const results: RawMessage[] = [];
  for (const id of ids) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });
    const parsed = parseMessage(detail.data, myEmail);
    if (parsed) results.push(parsed);
  }
  return results;
}

export async function getMyEmail(gmail: gmail_v1.Gmail): Promise<string> {
  const profile = await gmail.users.getProfile({ userId: "me" });
  return profile.data.emailAddress ?? "";
}

function parseMessage(
  data: gmail_v1.Schema$Message,
  myEmail: string
): RawMessage | null {
  const headers = data.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
  const fromRaw = getHeader("From");
  const toRaw = getHeader("To");
  const subject = getHeader("Subject");
  const dateStr = getHeader("Date");
  const snippet = data.snippet ?? "";
  if (!data.id || !data.threadId) return null;

  const fromParsed = parseAddress(fromRaw);
  const toParsed = parseAddress(toRaw);
  const isOutgoing = !!fromParsed && !!myEmail && fromParsed.address.toLowerCase() === myEmail.toLowerCase();

  const target = isOutgoing ? toParsed : fromParsed;
  if (!target) return null;

  return {
    id: data.id,
    threadId: data.threadId,
    fromName: target.name,
    fromAddress: target.address,
    fromDomain: target.domain,
    subject,
    snippet,
    date: dateStr ? new Date(dateStr) : new Date(),
    isOutgoing,
  };
}

function parseAddress(raw: string): { name?: string; address: string; domain: string } | null {
  if (!raw) return null;
  const angled = raw.match(/^(?:"?(.*?)"?\s*)?<(.+?)>$/);
  let name: string | undefined;
  let address: string;
  if (angled) {
    name = angled[1]?.trim() || undefined;
    address = angled[2] ?? "";
  } else {
    address = raw.trim();
  }
  const at = address.indexOf("@");
  if (at < 0) return null;
  const domain = address.slice(at + 1).toLowerCase().replace(/^www\./, "");
  return { name, address, domain };
}
