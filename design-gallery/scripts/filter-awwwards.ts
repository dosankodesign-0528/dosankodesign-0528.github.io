/**
 * Awwwards データの後処理フィルタ。
 *
 * 用途:
 *   - 「直近6ヶ月」のカットオフより古い Awwwards 項目を一括削除
 *   - 月あたり SOTD 8件 + Framer 4件 のキャップを既存データにも適用
 *   - scraper.ts のセクション縮小（Developer Award 除外）に伴うクリーンアップ
 *
 * 削除対象 (source === "awwwards" のみ):
 *   - date < (実行時点の6ヶ月前) → カットオフ削除
 *   - 上記を生き残った後、月内で SOTD 8件 + Framer 4件 を超える分 → キャップ削除
 *   - ただし starred=true は両ステップで保護（手動チェック済みは消さない）
 *
 * 使い方:
 *   npx tsx scripts/filter-awwwards.ts            # 実行（保存あり）
 *   DRY=1 npx tsx scripts/filter-awwwards.ts      # 削除予定だけ表示
 *   MONTHS=3 npx tsx scripts/filter-awwwards.ts   # カットオフ月数を変更
 *   SOTD_CAP=10 FRAMER_CAP=5 npx tsx scripts/filter-awwwards.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
const DRY = process.env.DRY === "1";
const MONTHS = parseInt(process.env.MONTHS || "6", 10);
const SOTD_CAP = parseInt(process.env.SOTD_CAP || "8", 10);
const FRAMER_CAP = parseInt(process.env.FRAMER_CAP || "4", 10);

interface ScrapedSite {
  id: string;
  title: string;
  source: string;
  date: string; // YYYY-MM
  starred?: boolean;
  signals?: string[];
  firstSeen?: string;
  [key: string]: unknown;
}

function cutoffMonth(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 7);
}

function isFramer(s: ScrapedSite): boolean {
  return (s.signals || []).includes("framer");
}

/**
 * Awwwards 月キャップ。
 * 月内で SOTD/Framer 別々に上限まで残す。優先順位:
 *   1) starred=true は無条件で残す
 *   2) firstSeen が新しいもの（無ければ id 文字列順）から残す
 */
function applyMonthlyCap(
  awwwardsSites: ScrapedSite[]
): { kept: ScrapedSite[]; removed: ScrapedSite[] } {
  const byMonth = new Map<string, ScrapedSite[]>();
  for (const s of awwwardsSites) {
    const arr = byMonth.get(s.date) || [];
    arr.push(s);
    byMonth.set(s.date, arr);
  }
  const kept: ScrapedSite[] = [];
  const removed: ScrapedSite[] = [];
  for (const arr of byMonth.values()) {
    // 新しい順（firstSeen 降順）。同点は id でタイブレーク
    arr.sort((a, b) => {
      const fa = a.firstSeen || "";
      const fb = b.firstSeen || "";
      if (fa !== fb) return fb.localeCompare(fa);
      return (b.id || "").localeCompare(a.id || "");
    });
    let sotdLeft = SOTD_CAP;
    let framerLeft = FRAMER_CAP;
    for (const s of arr) {
      if (s.starred) {
        kept.push(s);
        // starred はキャップ枠を消費しない（保護優先）
        continue;
      }
      if (isFramer(s)) {
        if (framerLeft > 0) {
          kept.push(s);
          framerLeft--;
        } else {
          removed.push(s);
        }
      } else {
        if (sotdLeft > 0) {
          kept.push(s);
          sotdLeft--;
        } else {
          removed.push(s);
        }
      }
    }
  }
  return { kept, removed };
}

function main() {
  const cutoff = cutoffMonth(MONTHS);
  console.log("🪒 Awwwards 古データ整理");
  console.log(`  カットオフ: ${cutoff}（${MONTHS}ヶ月前）以降を残す`);
  console.log(`  月キャップ: SOTD ${SOTD_CAP}件 + Framer ${FRAMER_CAP}件 / 月`);
  console.log(`  DRY=${DRY}`);
  console.log("=".repeat(50));

  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const before = sites.length;
  const awwBefore = sites.filter((s) => s.source === "awwwards").length;

  // ステップ1: カットオフ削除
  const removedByCutoff: ScrapedSite[] = [];
  const afterCutoff = sites.filter((s) => {
    if (s.source !== "awwwards") return true;
    if (s.date >= cutoff) return true;
    if (s.starred) return true; // 確認済みは温存
    removedByCutoff.push(s);
    return false;
  });

  // ステップ2: 月キャップ適用（awwwards のみ）
  const awwwardsAfterCutoff = afterCutoff.filter((s) => s.source === "awwwards");
  const others = afterCutoff.filter((s) => s.source !== "awwwards");
  const { kept: awwwardsCapped, removed: removedByCap } = applyMonthlyCap(awwwardsAfterCutoff);
  const kept = [...others, ...awwwardsCapped];

  const removed = [...removedByCutoff, ...removedByCap];

  console.log(`\n📊 統計`);
  console.log(`  total before:           ${before}`);
  console.log(`  awwwards before:        ${awwBefore}`);
  console.log(`  カットオフ削除:         ${removedByCutoff.length}`);
  console.log(`  月キャップ削除:         ${removedByCap.length}`);
  console.log(`  total after:            ${kept.length}`);
  console.log(`  awwwards after:         ${awwwardsCapped.length}`);

  // 月別の削除件数
  const removedByMonth: Record<string, { cutoff: number; cap: number }> = {};
  for (const r of removedByCutoff) {
    removedByMonth[r.date] = removedByMonth[r.date] || { cutoff: 0, cap: 0 };
    removedByMonth[r.date].cutoff++;
  }
  for (const r of removedByCap) {
    removedByMonth[r.date] = removedByMonth[r.date] || { cutoff: 0, cap: 0 };
    removedByMonth[r.date].cap++;
  }
  console.log(`\n  月別削除内訳（cutoff / cap）:`);
  Object.keys(removedByMonth)
    .sort()
    .forEach((m) =>
      console.log(`    ${m}: cutoff=${removedByMonth[m].cutoff} / cap=${removedByMonth[m].cap}`)
    );

  // 月別の残存件数（awwwards）
  const keptByMonth: Record<string, { sotd: number; framer: number }> = {};
  for (const s of awwwardsCapped) {
    keptByMonth[s.date] = keptByMonth[s.date] || { sotd: 0, framer: 0 };
    if (isFramer(s)) keptByMonth[s.date].framer++;
    else keptByMonth[s.date].sotd++;
  }
  console.log(`\n  月別残存（awwwards: sotd / framer）:`);
  Object.keys(keptByMonth)
    .sort()
    .forEach((m) =>
      console.log(`    ${m}: sotd=${keptByMonth[m].sotd} / framer=${keptByMonth[m].framer}`)
    );

  if (DRY) {
    console.log("\n--dry のため保存しません。削除サンプル先頭5件:");
    removed.slice(0, 5).forEach((r) => console.log(`  ${r.date}  ${r.title}`));
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(kept, null, 2), "utf-8");
  console.log(`\n💾 保存完了: ${DATA_PATH}`);
}

main();
