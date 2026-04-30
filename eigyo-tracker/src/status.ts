import type { RawMessage } from "./types.js";

export const STATUS = {
  WAITING: "待機中",
  C: "C：やりとりあり",
  B: "B：パートナー契約",
  S: "S:継続中",
  A: "A：取引あり",
  D: "D:ご縁がなかった",
} as const;

const REJECTION_PATTERNS = [
  /ご縁がな(い|かった)/,
  /お祈り/,
  /不採用/,
  /選考対象外/,
  /見送り(ます|となりました|させて)/,
  /ご期待に沿/,
  /採用に至りません/,
  /お見送り/,
  /残念ながら.*(難しい|採用|お見送り|お力に)/,
];

const ACTIVE_PROJECT_PATTERNS = [
  /Slack.*(ご案内|招待|参加)/,
  /ワークスペース(に|への)?招待/,
  /オンボーディング/,
  /キックオフ/,
  /(\d+月分)?請求書/,
  /納品(書|物)/,
  /検収/,
];

const CONTRACT_PATTERNS = [
  /業務委託契約/,
  /契約書/,
  /契約締結/,
  /NDA/,
  /秘密保持契約/,
  /署名(のお願い|済み)/,
  /ご契約完了/,
];

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
];

export interface StatusDetectionResult {
  status: string;
  reason: string;
  matchedKeyword: string;
}

export function detectStatusFromMessage(msg: RawMessage): StatusDetectionResult | null {
  const subject = msg.subject ?? "";
  const snippet = msg.snippet ?? "";
  const text = `${subject}\n${snippet}`;
  const isReply = /^(re:|fwd?:|返信:)/i.test(subject.trim());

  for (const p of REJECTION_PATTERNS) {
    const m = text.match(p);
    if (m) return { status: STATUS.D, reason: "拒絶系キーワード", matchedKeyword: m[0] };
  }

  for (const p of ACTIVE_PROJECT_PATTERNS) {
    const m = text.match(p);
    if (m) return { status: STATUS.S, reason: "プロジェクト稼働シグナル", matchedKeyword: m[0] };
  }

  for (const p of CONTRACT_PATTERNS) {
    const m = text.match(p);
    if (m) return { status: STATUS.B, reason: "契約締結シグナル", matchedKeyword: m[0] };
  }

  for (const p of MEETING_PATTERNS) {
    const m = text.match(p);
    if (m) return { status: STATUS.C, reason: "商談シグナル", matchedKeyword: m[0] };
  }

  if (isReply && !msg.isOutgoing) {
    return { status: STATUS.C, reason: "Re:付き返信受信", matchedKeyword: "Re:" };
  }

  return null;
}

const AUTO_UPDATABLE_STATUSES: Array<string | null> = [null, STATUS.WAITING];

export function canAutoUpdate(currentStatus: string | null): boolean {
  return AUTO_UPDATABLE_STATUSES.includes(currentStatus);
}

export function shouldUpdate(
  currentStatus: string | null,
  detectedStatus: string | null
): boolean {
  if (!detectedStatus) return false;
  if (!canAutoUpdate(currentStatus)) return false;
  if (currentStatus === detectedStatus) return false;
  return true;
}
