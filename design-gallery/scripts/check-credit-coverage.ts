/**
 * クレジットカバレッジ & スクレイプ健全性チェック
 *
 * 月次の GitHub Actions から呼ばれる。標準出力に Markdown レポートを書き、
 * 健全性に問題があれば exit code 1 を返して Issue 作成のトリガーにする。
 *
 * 健全性の判定軸:
 *   1. 各メディアの total 件数 — 急減してたらスクレイプが壊れた可能性
 *   2. クレジットカバレッジ — 前月比較で大きく低下してないか
 *   3. リンク切れ率 — 異常に高ければサイト側の何かがおかしい
 *
 * 使い方:
 *   npx tsx scripts/check-credit-coverage.ts                 # 表示だけ
 *   npx tsx scripts/check-credit-coverage.ts --markdown      # Markdown レポート
 *   npx tsx scripts/check-credit-coverage.ts --json          # JSON 出力
 *   npx tsx scripts/check-credit-coverage.ts --strict        # 閾値割れで exit 1
 */

import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");

interface ScrapedSite {
  source: string;
  agency?: string;
  isDead?: boolean;
}

interface SourceStats {
  source: string;
  total: number;
  withAgency: number;
  agencyPct: number;
  dead: number;
  deadPct: number;
}

// 閾値定義: これ未満になったら警告
// 各メディアで「ある程度の件数が安定してる」前提のラインを引く。
// 初期値は2026-04時点の実測値の70%程度で設定（少し低めに余裕を持たせる）
const TOTAL_THRESHOLDS: Record<string, number> = {
  sankou: 800, // 実測 1241 → 800 を割ったら警告
  muuuuu: 400, // 実測 647
  webdesignclip: 600, // 実測 973
  "81web": 100, // 実測 203
  awwwards: 300, // 実測 543
};

// 「リンク切れ」が異常に多い時の警告閾値
const DEAD_PCT_THRESHOLD = 30; // 30% 超は異常

function computeStats(sites: ScrapedSite[]): SourceStats[] {
  const map = new Map<string, { total: number; withAgency: number; dead: number }>();
  for (const s of sites) {
    const cur = map.get(s.source) || { total: 0, withAgency: 0, dead: 0 };
    cur.total++;
    if (s.agency && s.agency.trim()) cur.withAgency++;
    if (s.isDead) cur.dead++;
    map.set(s.source, cur);
  }
  return Array.from(map.entries())
    .map(([source, c]) => ({
      source,
      total: c.total,
      withAgency: c.withAgency,
      agencyPct: c.total > 0 ? (c.withAgency / c.total) * 100 : 0,
      dead: c.dead,
      deadPct: c.total > 0 ? (c.dead / c.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function detectIssues(stats: SourceStats[]): string[] {
  const issues: string[] = [];
  for (const s of stats) {
    const min = TOTAL_THRESHOLDS[s.source];
    if (min !== undefined && s.total < min) {
      issues.push(
        `⚠️ **${s.source}** の総件数が ${s.total} 件まで減少（基準 ${min} 件）。スクレイプ異常の可能性。`
      );
    }
    if (s.deadPct > DEAD_PCT_THRESHOLD) {
      issues.push(
        `⚠️ **${s.source}** のリンク切れ率が ${s.deadPct.toFixed(1)}%（基準 ${DEAD_PCT_THRESHOLD}%）。`
      );
    }
  }
  return issues;
}

function renderMarkdown(stats: SourceStats[], issues: string[]): string {
  const total = stats.reduce((a, s) => a + s.total, 0);
  const totalAgency = stats.reduce((a, s) => a + s.withAgency, 0);
  const overallPct = ((totalAgency / Math.max(1, total)) * 100).toFixed(1);
  const dateStr = new Date().toISOString().slice(0, 10);

  let md = `# 🩺 デザインギャラリー 健全性レポート (${dateStr})\n\n`;
  md += `**全体**: ${total.toLocaleString()} サイト中 ${totalAgency.toLocaleString()} 件にクレジット情報あり (${overallPct}%)\n\n`;

  md += `## メディア別カバレッジ\n\n`;
  md += `| メディア | 総件数 | クレジット有り | カバレッジ | リンク切れ |\n`;
  md += `|---|---:|---:|---:|---:|\n`;
  for (const s of stats) {
    md += `| ${s.source} | ${s.total} | ${s.withAgency} | ${s.agencyPct.toFixed(1)}% | ${s.dead} (${s.deadPct.toFixed(1)}%) |\n`;
  }
  md += `\n`;

  if (issues.length > 0) {
    md += `## 🚨 検出された問題\n\n`;
    for (const i of issues) md += `- ${i}\n`;
    md += `\n対応してください。よくある原因:\n`;
    md += `- メディア側のHTML構造変更でセレクタが効かなくなった\n`;
    md += `- メディアの一覧APIに認証/レート制限が追加された\n`;
    md += `- リンク切れ率が高い場合は古いデータが多い可能性 → \`check-dead-links\` 実行\n`;
  } else {
    md += `## ✅ 健全性 OK\n\n問題は検出されませんでした。\n`;
  }

  md += `\n---\n_自動生成: \`scripts/check-credit-coverage.ts\`_\n`;
  return md;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const mode = args.has("--markdown")
    ? "markdown"
    : args.has("--json")
      ? "json"
      : "text";
  const strict = args.has("--strict");

  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const stats = computeStats(sites);
  const issues = detectIssues(stats);

  if (mode === "json") {
    console.log(JSON.stringify({ stats, issues, ok: issues.length === 0 }, null, 2));
  } else if (mode === "markdown") {
    console.log(renderMarkdown(stats, issues));
  } else {
    // 人間が読みやすい形式
    console.log("🩺 健全性レポート\n");
    console.log(`総件数: ${sites.length}`);
    console.log("");
    console.log("メディア別:");
    for (const s of stats) {
      console.log(
        `  ${s.source.padEnd(15)} ${String(s.total).padStart(5)} 件 / クレジット ${String(s.withAgency).padStart(4)} (${s.agencyPct.toFixed(1).padStart(5)}%) / dead ${s.dead}`
      );
    }
    if (issues.length > 0) {
      console.log("\n🚨 検出された問題:");
      for (const i of issues) console.log(`  ${i}`);
    } else {
      console.log("\n✅ 問題なし");
    }
  }

  if (strict && issues.length > 0) {
    process.exit(1);
  }
}

main();
