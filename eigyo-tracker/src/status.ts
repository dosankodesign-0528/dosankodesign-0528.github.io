import type { RawMessage } from "./types.js";

export const STATUS = {
  WAITING: "待機中",
  C: "C：やりとりあり",
  B: "B：パートナー契約",
  A: "A：取引あり",
  S: "S:継続中",
  D: "D:ご縁がなかった",
} as const;

export type SignalType = "REJECTION" | "INVITE" | "CONTRACT" | "MEETING" | "REPLY";

export interface StatusDetectionResult {
  signal: SignalType;
  status: string;
  reason: string;
  matchedKeyword: string;
}

// 自動返信メール検知（フォーム送信完了通知など）
// マッチしたら status 検知をスキップする → 自分の送信内容がエコーされて誤検知するのを防ぐ
const AUTO_REPLY_PATTERNS = [
  /本メール(は|を)?自動(送信|配信)/,
  /自動返信/,
  /(お)?問(い|合)合?わ?せ.{0,15}(を)?(受け付け|お受け|頂戴|承り)/,
  /(お)?(問い?合わ?せ|入力)(内容|頂いた|頂戴)/,
  /返信(は)?不要/,
  /折り返し.{0,15}(担当者|改めて|連絡)/,
  /確認(の|出来|でき)次第/,
  /3?営業日以内に.{0,15}(連絡|返信)/,
  /担当者より.{0,15}(連絡|折り返し|ご案内)/,
];

// REJECTION: D へ移行（自動更新は待機中のみ、それ以外は段飛ばし通知）
const REJECTION_PATTERNS = [
  /ご縁がな(い|かった)/,
  /お祈り/,
  /不採用/,
  /選考対象外/,
  /見送り(ます|となりました|させて|たい)/,
  /ご期待に沿/,
  /採用に至りません/,
  /お見送り/,
  /残念ながら.*(難しい|採用|お見送り|お力に)/,
  /今回は.*(マッチ|条件).*合(わ|い)(ない|ません)/,
  /採用を見送らせて/,
  /選考通過は(難しい|でき(ない|ません))/,
  /募集.*(終了|締め切)/,
  /ポジション.*(クローズ|終了)/,
  /選考結果のご連絡.*(誠に|残念)/,
  /またのご応募/,
  /やり取り(は|を)?(終了|終わ)/,
  /対応(は|を)?(終了|終わ)/,
  /(本件|案件)(は|を)?クローズ/,
];

// INVITE: B → A（Slack/ChatWork/Notion/Asana等の招待メール）
const INVITE_FROM_DOMAINS = new Set([
  "slack.com",
  "chatwork.com",
  "makenotion.com",
  "notion.so",
  "asana.com",
  "trello.com",
  "atlassian.com",
  "atlassian.net",
]);
const INVITE_KEYWORDS = [
  /invited you to/i,
  /added you to/i,
  /join\.slack\.com/i,
  /ワークスペース(へ|に)(の)?(ご)?招待/,
  /\[Chatwork\].*(ご招待|招待)/,
  /グループチャット.*(招待|参加)/,
];

// CONTRACT: C → B（契約締結シグナル）
// 複合判定:
//   ・クラウドサインからの送信元 → 確定（添付不要）
//   ・契約系キーワード + 添付ファイル → 確定
//   ・契約系キーワード + 添付ファイル名に「契約|NDA|秘密保持|業務委託」 → 確定
//   ・キーワード単独では発火しない（auto-reply で誤爆するため）
const CONTRACT_FROM_DOMAINS = new Set([
  "cloudsign.jp",
  "mail.cloudsign.jp",
]);
const CONTRACT_PATTERNS = [
  /業務委託契約/,
  /契約書/,
  /契約締結/,
  /NDA/,
  /秘密保持契約/,
  /署名(のお願い|済み|依頼)/,
  /ご契約完了/,
  /契約(条件|内容)(の|を)?(ご)?確認/,
  /請書/,
  /覚書/,
];
const CONTRACT_FILENAME_PATTERNS = [
  /契約/,
  /NDA/i,
  /秘密保持/,
  /業務委託/,
  /覚書/,
];

// MEETING: 待機 → C（商談シグナル）
// 「業務委託枠」「業務委託枠での」のような汎用語は削除（auto-reply で誤爆する）
// 残すのは「明確な商談アクション」を示すもののみ
const MEETING_PATTERNS = [
  /面談(の|を|させて|について|日程|お願い)/,
  /面接(の|を|させて|について|日程|お願い)/,
  /(お)?打ち?合わ?せ(の|を|させて|日程|お願い)/,
  /Zoom.*(URL|リンク|ご案内|招待)/i,
  /Google\s*Meet.*(URL|リンク|ご案内|招待)/i,
  /カレンダー(招待|を承諾|の共有)/,
  /共有カレンダー/,
  /カジュアル(面談|にお話)/,
  /(オンライン)?MTG.*(日程|お願い|設定)/i,
];

function matchPatterns(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function matchFileName(names: string[] | undefined, patterns: RegExp[]): string | null {
  if (!names || names.length === 0) return null;
  for (const name of names) {
    for (const p of patterns) {
      if (p.test(name)) return name;
    }
  }
  return null;
}

function matchInvite(msg: RawMessage, text: string): string | null {
  const fromDomain = (msg.fromDomain ?? "").toLowerCase();
  if (!INVITE_FROM_DOMAINS.has(fromDomain)) return null;
  return matchPatterns(text, INVITE_KEYWORDS);
}

interface ContractMatch {
  keyword: string;
  source: "domain" | "keyword+attachment" | "filename";
}

function matchContract(msg: RawMessage, text: string): ContractMatch | null {
  const fromDomain = (msg.fromDomain ?? "").toLowerCase();
  // クラウドサイン送信元 → 確定
  if (CONTRACT_FROM_DOMAINS.has(fromDomain)) {
    return { keyword: `送信元:${fromDomain}`, source: "domain" };
  }
  // 添付ファイル名が契約系 → 確定
  const fileMatch = matchFileName(msg.attachmentNames, CONTRACT_FILENAME_PATTERNS);
  if (fileMatch) {
    return { keyword: `添付:${fileMatch}`, source: "filename" };
  }
  // 契約キーワード + 任意の添付 → 確定（キーワード単独はNG）
  const kw = matchPatterns(text, CONTRACT_PATTERNS);
  if (kw && msg.attachmentNames && msg.attachmentNames.length > 0) {
    return {
      keyword: `${kw} + 添付${msg.attachmentNames.length}件(${msg.attachmentNames.join(",")})`,
      source: "keyword+attachment",
    };
  }
  return null;
}

export function detectStatusFromMessage(msg: RawMessage): StatusDetectionResult | null {
  const subject = msg.subject ?? "";
  const snippet = msg.snippet ?? "";
  const body = msg.body ?? "";
  const text = body
    ? `${subject}\n${snippet}\n${body}`
    : `${subject}\n${snippet}`;
  const isReply = /^(re:|fwd?:|返信:)/i.test(subject.trim());

  // Priority 0: 自動返信メール → status 検知スキップ
  // 自分の問合せフォーム送信内容がエコーされて誤検知するのを防ぐ
  const autoReplyKw = matchPatterns(text, AUTO_REPLY_PATTERNS);
  if (autoReplyKw) {
    return null;
  }

  // Priority 1: REJECTION（最優先）
  const rejKw = matchPatterns(text, REJECTION_PATTERNS);
  if (rejKw) {
    return { signal: "REJECTION", status: STATUS.D, reason: "拒絶系キーワード", matchedKeyword: rejKw };
  }

  // Priority 2: INVITE（送信元 + キーワードのAND）
  const inviteKw = matchInvite(msg, text);
  if (inviteKw) {
    return { signal: "INVITE", status: STATUS.A, reason: "招待メール", matchedKeyword: `${msg.fromDomain}「${inviteKw}」` };
  }

  // Priority 3: CONTRACT（複合判定 — 単独キーワードは NG）
  const contract = matchContract(msg, text);
  if (contract) {
    return { signal: "CONTRACT", status: STATUS.B, reason: "契約締結シグナル", matchedKeyword: contract.keyword };
  }

  // Priority 4: MEETING（明確な商談アクションのみ）
  const meetingKw = matchPatterns(text, MEETING_PATTERNS);
  if (meetingKw) {
    return { signal: "MEETING", status: STATUS.C, reason: "商談シグナル", matchedKeyword: meetingKw };
  }

  // Priority 5: Re: 付き返信（弱い、待機中→C のフォールバック）
  if (isReply && !msg.isOutgoing) {
    return { signal: "REPLY", status: STATUS.C, reason: "Re:付き返信受信", matchedKeyword: "Re:" };
  }

  return null;
}

// 段階順設計
const ALLOWED_TRANSITIONS: Record<SignalType, ReadonlySet<string | null>> = {
  REJECTION: new Set([null, STATUS.WAITING]),
  MEETING: new Set([null, STATUS.WAITING]),
  CONTRACT: new Set([STATUS.C]),
  INVITE: new Set([STATUS.B]),
  REPLY: new Set([null, STATUS.WAITING]),
};

export function shouldUpdate(
  currentStatus: string | null,
  detection: StatusDetectionResult | null
): boolean {
  if (!detection) return false;
  if (currentStatus === detection.status) return false;
  return ALLOWED_TRANSITIONS[detection.signal].has(currentStatus);
}

const STATUS_ORDER: string[] = [STATUS.WAITING, STATUS.C, STATUS.B, STATUS.A, STATUS.S];

export function isManualReviewCandidate(
  currentStatus: string | null,
  detection: StatusDetectionResult | null
): boolean {
  if (!detection) return false;
  if (currentStatus === detection.status) return false;
  if (ALLOWED_TRANSITIONS[detection.signal].has(currentStatus)) return false;
  if (detection.signal === "REJECTION") return true;
  const currentIdx = currentStatus ? STATUS_ORDER.indexOf(currentStatus) : 0;
  const targetIdx = STATUS_ORDER.indexOf(detection.status);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx > currentIdx;
}
