import type { gmail_v1 } from "googleapis";
import { fetchMessages } from "./gmail.js";
import type { RawMessage } from "./types.js";

const SUSPECT_KEYWORDS = [
  "お問い合わせ",
  "お問合せ",
  "お問い合せ",
  "問い合わせ",
  "書類選考",
  "選考結果",
  "ご応募",
  "応募ありがとう",
  "採用",
  "スカウト",
  "業務委託",
  "案件",
  "ご依頼",
  "ご提案",
  "秘密保持",
  "面接",
  "面談",
  "オファー",
];

export async function reportUnclassifiedCandidates(
  gmail: gmail_v1.Gmail,
  myEmail: string,
  processedIds: Set<string>,
  lookbackDays: number
): Promise<void> {
  const broadQuery = `(${SUSPECT_KEYWORDS.map((k) => `subject:${k}`).join(" OR ")}) -in:trash -in:spam`;
  let suspects: RawMessage[];
  try {
    suspects = await fetchMessages(gmail, broadQuery, lookbackDays, myEmail);
  } catch (err: any) {
    console.log(`[learn] broad-search error: ${err?.message ?? err}`);
    return;
  }
  const missed = suspects.filter((m) => !processedIds.has(m.id));
  if (missed.length === 0) {
    console.log(`[learn] 拾い損ねたメール: 0 件 ✨`);
    return;
  }
  console.log(`\n[learn] 拾い損ねたかもしれない営業メール: ${missed.length} 件`);
  console.log(`[learn] (これらをカバーしたい場合は sources.json にクエリを追加してください)`);
  const subjectCounts = new Map<string, number>();
  for (const msg of missed) {
    const keyword = pickKeyword(msg.subject);
    if (keyword) {
      subjectCounts.set(keyword, (subjectCounts.get(keyword) ?? 0) + 1);
    }
    console.log(`  - "${msg.subject.slice(0, 60)}" from ${msg.fromAddress}`);
  }
  if (subjectCounts.size > 0) {
    console.log(`\n[learn] 頻出キーワード:`);
    const sorted = Array.from(subjectCounts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [keyword, count] of sorted.slice(0, 10)) {
      console.log(`  ${count}× ${keyword}`);
    }
  }
}

function pickKeyword(subject: string): string | null {
  for (const k of SUSPECT_KEYWORDS) {
    if (subject.includes(k)) return k;
  }
  return null;
}
