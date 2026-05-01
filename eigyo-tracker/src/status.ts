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
  /署名(のお願い|済み)/,
  /ご契約完了/,
  /契約(条件|内容)(の|を)?(ご)?確認/,
  /請書/,
  /覚書/,
];

// MEETING: 待機 → C（商談シグナル）
const MEETING_PATTERNS = [
  /面談/,
  /面接/,
  /(お)?打ち合わせ/,
  /Zoom/i,
  /Google\s*Meet/i,
  /業務委託枠/,
  /選考のご案内/,
  /追加面談/,
  /カレンダー(招待|を承諾)/,
  /共有カレンダー/,
  /カジュアル(面談|にお話)/,
];

function matchPatterns(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function matchInvite(msg: RawMessage, text: string): string | null {
  const fromDomain = (msg.fromDomain ?? "").toLowerCase();
  if (!INVITE_FROM_DOMAINS.has(fromDomain)) return null;
  // Domain だけだと通常通知も拾う → keyword とAND判定
  return matchPatterns(text, INVITE_KEYWORDS);
}

function matchContract(msg: RawMessage, text: string): { keyword: string; isDomain: boolean } | null {
  const fromDomain = (msg.fromDomain ?? "").toLowerCase();
  if (CONTRACT_FROM_DOMAINS.has(fromDomain)) {
    // クラウドサインからは契約案件しか来ないので送信元だけで確定
    return { keyword: `送信元:${fromDomain}`, isDomain: true };
  }
  const kw = matchPatterns(text, CONTRACT_PATTERNS);
  if (kw) return { keyword: kw, isDomain: false };
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

  // Priority 1: REJECTION（最優先：「面談ありがとう、でもご縁が...」みたいなケースを正しく D に）
  const rejKw = matchPatterns(text, REJECTION_PATTERNS);
  if (rejKw) {
    return { signal: "REJECTION", status: STATUS.D, reason: "拒絶系キーワード", matchedKeyword: rejKw };
  }

  // Priority 2: INVITE（送信元 + キーワードのAND、最も精度高い）
  const inviteKw = matchInvite(msg, text);
  if (inviteKw) {
    return { signal: "INVITE", status: STATUS.A, reason: "招待メール", matchedKeyword: `${msg.fromDomain}「${inviteKw}」` };
  }

  // Priority 3: CONTRACT
  const contract = matchContract(msg, text);
  if (contract) {
    return { signal: "CONTRACT", status: STATUS.B, reason: "契約締結シグナル", matchedKeyword: contract.keyword };
  }

  // Priority 4: MEETING
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

// 段階順設計: シグナル別に「自動更新できる現状ステータス」を制限
const ALLOWED_TRANSITIONS: Record<SignalType, ReadonlySet<string | null>> = {
  REJECTION: new Set([null, STATUS.WAITING]), // 自動Dは待機中のみ。それ以外は手動推奨通知
  MEETING: new Set([null, STATUS.WAITING]), // 待機 → C
  CONTRACT: new Set([STATUS.C]), // C → B（待機中での検知は段飛ばし通知）
  INVITE: new Set([STATUS.B]), // B → A（C/待機中での検知は段飛ばし通知）
  REPLY: new Set([null, STATUS.WAITING]), // 待機 → C のフォールバック
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

/**
 * 段飛ばし候補・降格候補かどうか（自動更新はしないが、人間に通知すべきケース）
 *
 * - 待機中で「契約書」検知 → CONTRACT は C 必須なので段飛ばし → true
 * - C段階で「不採用」検知 → REJECTION は待機中のみ自動 → 降格候補 → true
 * - A段階で「Re:返信」検知 → 後退方向 → false（無視）
 */
export function isManualReviewCandidate(
  currentStatus: string | null,
  detection: StatusDetectionResult | null
): boolean {
  if (!detection) return false;
  if (currentStatus === detection.status) return false;
  if (ALLOWED_TRANSITIONS[detection.signal].has(currentStatus)) return false;

  // REJECTION は降格候補としてどの段階からも通知
  if (detection.signal === "REJECTION") return true;

  // 進行系シグナル（INVITE/CONTRACT/MEETING/REPLY）は前進方向のみ通知
  const currentIdx = currentStatus ? STATUS_ORDER.indexOf(currentStatus) : 0;
  const targetIdx = STATUS_ORDER.indexOf(detection.status);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx > currentIdx;
}
