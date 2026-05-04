/**
 * Awwwards データの後処理フィルタ。
 *
 * 用途:
 *   - 「直近6ヶ月」のカットオフより古い Awwwards 項目を一括削除
 *   - scraper.ts のセクション縮小（Developer Award 除外）に伴うクリーンアップ
 *
 * 削除対象 (source === "awwwards" のみ):
 *   - date < (実行時点の6ヶ月前)
 *
 * 使い方:
 *   npx tsx scripts/filter-awwwards.ts            # 実行（保存あり）
 *   DRY=1 npx tsx scripts/filter-awwwards.ts      # 削除予定だけ表示
 *   MONTHS=3 npx tsx scripts/filter-awwwards.ts   # カットオフ月数を変更
 */

import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
const DRY = process.env.DRY === "1";
const MONTHS = parseInt(process.env.MONTHS || "6", 10);

interface ScrapedSite {
  id: string;
  title: string;
  source: string;
  date: string; // YYYY-MM
  starred?: boolean;
  [key: string]: unknown;
}

function cutoffMonth(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 7);
}

function main() {
  const cutoff = cutoffMonth(MONTHS);
  console.log("🪒 Awwwards 古データ整理");
  console.log(`  カットオフ: ${cutoff}（${MONTHS}ヶ月前）以降を残す`);
  console.log(`  DRY=${DRY}`);
  console.log("=".repeat(50));

  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const before = sites.length;
  const awwBefore = sites.filter((s) => s.source === "awwwards").length;

  const removed: ScrapedSite[] = [];
  const kept = sites.filter((s) => {
    if (s.source !== "awwwards") return true;
    if (s.date >= cutoff) return true;
    // starred (確認済み) は念のため温存（ユーザーが手動でチェックしたものは消さない）
    if (s.starred) return true;
    removed.push(s);
    return false;
  });

  console.log(`\n📊 統計`);
  console.log(`  total before:        ${before}`);
  console.log(`  awwwards before:     ${awwBefore}`);
  console.log(`  削除対象:            ${removed.length}`);
  console.log(`  total after:         ${kept.length}`);
  console.log(`  awwwards after:      ${kept.filter((s) => s.source === "awwwards").length}`);

  // 月別の削除件数
  const removedByMonth: Record<string, number> = {};
  for (const r of removed) {
    removedByMonth[r.date] = (removedByMonth[r.date] || 0) + 1;
  }
  console.log(`\n  月別削除内訳:`);
  Object.keys(removedByMonth)
    .sort()
    .forEach((m) => console.log(`    ${m}: ${removedByMonth[m]}`));

  if (DRY) {
    console.log("\n--dry のため保存しません。先頭5件のサンプル:");
    removed.slice(0, 5).forEach((r) => console.log(`  ${r.date}  ${r.title}`));
    return;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(kept, null, 2), "utf-8");
  console.log(`\n💾 保存完了: ${DATA_PATH}`);
}

main();
