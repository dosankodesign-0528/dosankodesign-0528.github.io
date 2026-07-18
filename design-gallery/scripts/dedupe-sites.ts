/**
 * scraped-sites.json の重複統合スクリプト（手動実行）。
 *
 * normalizeUrl の強化（2026-07-18: 言語セグメント /ja 等・モバイル sp./m. の統合）で
 * 「実は同じサイト」になったエントリ同士をマージする。
 *   例: anri.vc/ja と anri.vc / sp.example.com と example.com
 *
 * マージ規則（グループ内で1件だけ残す）:
 *   1. pickup 以外のソース（実日付を持つ日次スクレイプ産）を優先
 *   2. それでも複数なら firstSeen が古い方（先にギャラリーに居た方）
 *   3. isDead / lastCheckedAt / starred / signals は「良い方」を統合
 *      （starred=true がどれかにあれば残す・isDead は全員 dead のときだけ true）
 *
 * 同じ会社の「意味のある別ページ」（採用サイト等）は正規化キーが異なるので
 * マージ対象にならない（2026-07-18 ヒデさん方針: 別作品として残す）。
 *
 * 使い方: npx tsx scripts/dedupe-sites.ts
 */
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

interface Site {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  starred: boolean;
  firstSeen?: string;
  isDead?: boolean;
  lastCheckedAt?: string;
  signals?: string[];
  [k: string]: unknown;
}

function main() {
  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const sites = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Site[];

  const groups = new Map<string, Site[]>();
  for (const s of sites) {
    const k = normalizeUrl(s.url);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const merged: Site[] = [];
  let removed = 0;
  const examples: string[] = [];

  for (const [, g] of groups) {
    if (g.length === 1) {
      merged.push(g[0]);
      continue;
    }
    // 1) pickup 以外を優先、2) firstSeen が古い方
    const sorted = [...g].sort((a, b) => {
      const ap = a.source === "pickup" ? 1 : 0;
      const bp = b.source === "pickup" ? 1 : 0;
      if (ap !== bp) return ap - bp;
      return (a.firstSeen || "9999").localeCompare(b.firstSeen || "9999");
    });
    const keep = { ...sorted[0] };
    // 3) フラグ統合
    keep.starred = g.some((x) => x.starred);
    keep.isDead = g.every((x) => x.isDead === true) ? true : undefined;
    if (keep.isDead === undefined) delete keep.isDead;
    const checked = g.map((x) => x.lastCheckedAt).filter(Boolean).sort();
    if (checked.length > 0) keep.lastCheckedAt = checked[checked.length - 1];
    const signals = new Set<string>(g.flatMap((x) => x.signals || []));
    if (signals.size > 0) keep.signals = [...signals];

    merged.push(keep);
    removed += g.length - 1;
    if (examples.length < 12) {
      examples.push(
        g.map((x) => `[${x.source}]${x.url.replace(/^https?:\/\//, "").slice(0, 40)}`).join(" + ") +
          ` → 残: [${keep.source}]`
      );
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`✅ 統合完了: ${sites.length} → ${merged.length} 件（${removed} 件をマージ）`);
  examples.forEach((e) => console.log("  ", e));
}

main();
