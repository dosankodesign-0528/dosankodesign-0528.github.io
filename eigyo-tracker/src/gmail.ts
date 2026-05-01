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
  myEmail: string,
  options: { withBody?: boolean } = {}
): Promise<RawMessage[]> {
  const fullQuery = `${query} newer_than:${lookbackDays}d`;
  const list = await gmail.users.messages.list({
    userId: "me",
    q: fullQuery,
    maxResults: 100,
  });
  const ids = (list.data.messages ?? []).map((m) => m.id).filter((x): x is string => !!x);
  const results: RawMessage[] = [];
  const withBody = options.withBody === true;
  for (const id of ids) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id,
      ...(withBody
        ? { format: "full" }
        : { format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] }),
    });
    const parsed = parseMessage(detail.data, myEmail, withBody);
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
  myEmail: string,
  withBody = false
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

  const body = withBody ? extractBody(data.payload).slice(0, 5000) : undefined;
  const attachmentNames = withBody ? extractAttachmentNames(data.payload) : undefined;

  return {
    id: data.id,
    threadId: data.threadId,
    fromName: target.name,
    fromAddress: target.address,
    fromDomain: target.domain,
    subject,
    snippet,
    body,
    date: dateStr ? new Date(dateStr) : new Date(),
    isOutgoing,
    attachmentNames,
  };
}

function extractAttachmentNames(payload: gmail_v1.Schema$MessagePart | undefined): string[] {
  if (!payload) return [];
  const names: string[] = [];
  const walk = (part: gmail_v1.Schema$MessagePart) => {
    // filename があり、attachmentId があれば添付ファイル
    if (part.filename && part.body?.attachmentId) {
      names.push(part.filename);
    }
    if (part.parts) {
      for (const child of part.parts) walk(child);
    }
  };
  walk(payload);
  return names;
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data));
  }
  if (payload.parts && payload.parts.length > 0) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain) {
      const result = extractBody(plain);
      if (result) return result;
    }
    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html) {
      const result = extractBody(html);
      if (result) return result;
    }
    for (const part of payload.parts) {
      const result = extractBody(part);
      if (result) return result;
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

function decodeBase64Url(data: string): string {
  try {
    return Buffer.from(data, "base64url").toString("utf-8");
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
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
