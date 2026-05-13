import { toKana, toHiragana } from "wanakana";
import type { CompanyRecord } from "./types.js";

// 重複検知の正規化キー：
// - 株式会社/有限会社/Inc/Corp などの法人格を除去
// - NFKC で全角半角統一
// - ローマ字 → カタカナ → ひらがな で表記揺れを吸収
// - 大文字小文字統一 / 記号スペース除去
// 「Studio Spoon」「スタジオスプーン」「すたじおすぷーん」「STUDIO SPOON Inc.」を全部同じキーにする狙い。

const LEGAL_SUFFIX = /株式会社|（株）|\(株\)|有限会社|合同会社|合資会社|合名会社|一般社団法人|社団法人|財団法人|医療法人|学校法人|inc\.?|incorporated|llc|l\.l\.c\.?|ltd\.?|co\.?(,)?\s*ltd\.?|corp\.?(oration)?|gmbh|s\.?a\.?|s\.?l\.?|pty\.?\s*ltd\.?/gi;
const PUNCT = /[\s\-_,\.\/\\・･、。「」『』【】\[\]\(\)（）「」"'＂＇`~!?！？@#$%^&*+=<>:;｜|]/g;

/**
 * 正規化キーを返す。空文字の場合は重複判定対象外。
 */
export function normalizeForDup(rawName: string): string {
  if (!rawName) return "";
  // 1) NFKC で全角半角・互換文字を正規化
  let s = rawName.normalize("NFKC");
  // 2) 法人格を除去
  s = s.replace(LEGAL_SUFFIX, "");
  // 3) wanakana でローマ字をカタカナに（既にカナ・漢字なら変化なし）
  //    例: "Studio Spoon" → "スタジオスプーン"
  s = toKana(s, { IMEMode: false, useObsoleteKana: false });
  // 4) カタカナ → ひらがなに統一
  s = toHiragana(s);
  // 5) 大文字小文字統一 + 記号スペース除去
  s = s.toLowerCase().replace(PUNCT, "");
  return s.trim();
}

/**
 * URL のドメインを正規化（www. と末尾スラッシュ除去）。
 * 重複検知のための片方の判定軸。
 */
export function normalizeDomain(url: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");
  }
}

export interface DuplicateGroup {
  /** 同一キー（ドメイン or 正規化名） */
  key: string;
  /** ドメイン一致なのか名前一致なのか */
  kind: "domain" | "name";
  /** 重複しているレコード */
  members: Array<{ pageId: string; name: string; url: string | null }>;
}

/**
 * 重複している会社レコードのグループを返す。
 * - ドメイン一致 OR 正規化名一致 のどちらかでグループ化
 * - 2 レコード以上あるグループだけ返す
 */
export function findDuplicateGroups(companies: CompanyRecord[]): DuplicateGroup[] {
  const byDomain = new Map<string, CompanyRecord[]>();
  const byName = new Map<string, CompanyRecord[]>();
  for (const c of companies) {
    const dom = normalizeDomain(c.url);
    if (dom) {
      const arr = byDomain.get(dom) ?? [];
      arr.push(c);
      byDomain.set(dom, arr);
    }
    const nameKey = normalizeForDup(c.name);
    if (nameKey) {
      const arr = byName.get(nameKey) ?? [];
      arr.push(c);
      byName.set(nameKey, arr);
    }
  }
  const groups: DuplicateGroup[] = [];
  for (const [key, members] of byDomain) {
    if (members.length >= 2) {
      groups.push({
        key,
        kind: "domain",
        members: members.map((c) => ({ pageId: c.pageId, name: c.name, url: c.url })),
      });
    }
  }
  for (const [key, members] of byName) {
    if (members.length < 2) continue;
    // 既にドメイン一致で同じ pageId 集合が拾えていたら名前グループはスキップ
    // （Set 比較で重複報告を避ける）
    const ids = members.map((m) => m.pageId).sort().join(",");
    const dupOfDomain = groups.some(
      (g) =>
        g.kind === "domain" &&
        g.members
          .map((m) => m.pageId)
          .sort()
          .join(",") === ids
    );
    if (dupOfDomain) continue;
    groups.push({
      key,
      kind: "name",
      members: members.map((c) => ({ pageId: c.pageId, name: c.name, url: c.url })),
    });
  }
  return groups;
}

/**
 * 重複している pageId の集合を返す（checkbox を ON にする対象）。
 */
export function collectDuplicatedPageIds(groups: DuplicateGroup[]): Set<string> {
  const ids = new Set<string>();
  for (const g of groups) for (const m of g.members) ids.add(m.pageId);
  return ids;
}
