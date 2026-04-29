/**
 * SANKOU! クレジット情報パッチスクリプト
 *
 * SANKOU! の各サイト詳細ページ (`https://sankoudesign.com/web/{slug}/`) には
 * `<div class="credit_box">` があり、Design / Direction / Animation 等の
 * 役割と制作者名（カッコ内に所属/会社名）が載っている。
 *
 * 例:
 *   Design, HTML+CSS, Direction, WordPress
 *   Tatsushi Fujiwara（Shinayaka design）
 *   ↓ 抽出ルール
 *   agency = "Shinayaka design"  // カッコ内の所属を採用
 *   なければ最初の人物名そのものを agency にセット
 *
 * 実装の流れ:
 *   1. scraped-sites.json を読み込み、source='sankou' かつ agency 未設定のサイト抽出
 *   2. 各サイトの title で WP REST API を叩いて post 取得 → post.link が detail URL
 *   3. detail HTML を fetch して credit_box の中身をパース
 *   4. agency にセット → 全件処理後に scraped-sites.json を上書き
 *
 * 使い方:
 *   npx tsx scripts/enrich-credits-sankou.ts            # 全件処理
 *   LIMIT=10 npx tsx scripts/enrich-credits-sankou.ts   # 先頭10件だけ（テスト用）
 *   FORCE=1 npx tsx scripts/enrich-credits-sankou.ts    # 既に agency 入ってても上書き
 *
 * レート制限: 1秒/req（SANKOU側に優しく）
 * 並列度: 3（過負荷を避けつつ高速化）
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const DATA_PATH = path.join(__dirname, "..", "src", "data", "scraped-sites.json");

interface ScrapedSite {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  category: string[];
  taste: string[];
  agency?: string;
  date: string;
  starred: boolean;
  isAgency?: boolean;
  signals?: string[];
  enrichedAt?: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * SANKOU! の WP REST API でタイトル検索 → 最初のヒットを返す。
 * タイトル完全一致 or 部分一致を優先。失敗時は null。
 */
async function searchSankouPostByTitle(
  title: string
): Promise<{ link: string } | null> {
  const apiUrl = `https://sankoudesign.com/wp-json/wp/v2/posts?search=${encodeURIComponent(
    title
  )}&per_page=5`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const posts = (await res.json()) as Array<{
      title?: { rendered?: string };
      link?: string;
    }>;
    if (!posts.length) return null;

    // タイトル完全一致を優先
    const norm = (s: string) =>
      s
        .replace(/<[^>]+>/g, "")
        .replace(/&[#a-z0-9]+;/gi, "")
        .replace(/\s+/g, "")
        .toLowerCase();
    const target = norm(title);
    const hit =
      posts.find((p) => norm(p.title?.rendered || "") === target) || posts[0];
    return hit.link ? { link: hit.link } : null;
  } catch {
    return null;
  }
}

/**
 * SANKOU! 詳細ページ HTML から credit_box の中身を取得 → agency 抽出
 */
async function fetchAgencyFromDetail(detailUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(detailUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    return extractAgencyFromHtml(html);
  } catch {
    return null;
  }
}

/**
 * credit_box から代表的な制作者名 / 所属を抽出する。
 *
 * SANKOU の credit_box は以下のような形式：
 *   <div class="credit_box">
 *     <p>Design, HTML+CSS, Direction, WordPress</p>
 *     <p>Tatsushi Fujiwara（Shinayaka design）</p>
 *     <p>Animation</p>
 *     <p>Kano Endo（Shinayaka design）</p>
 *     ...
 *   </div>
 *
 * ルール:
 *   1. <p> を順に走査し、人物名が含まれる行を探す（役割行は短い英単語のみ）
 *   2. カッコ内に所属があればそれを agency に。日本語/英語両対応
 *   3. カッコがなければ人物名そのものを agency に
 *   4. 役割行（"Design, Direction" 等）はスキップ
 *   5. 最も多く登場する所属を agency に採用（同一会社が複数役割を兼ねるパターン）
 */
export function extractAgencyFromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  const $box = $("div.credit_box").first();
  if ($box.length === 0) return null;

  const lines: string[] = [];
  $box.find("p, li, dd, span").each((_, el) => {
    const t = $(el).text().trim();
    if (t) lines.push(t);
  });
  if (lines.length === 0) {
    // フォールバック: テキスト全体を改行で分割
    const text = $box.text().trim();
    text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => lines.push(s));
  }

  // 役割行の判定: 短くて英単語/カンマだけ、または日本語の単独単語
  const roleWords = new Set([
    "design",
    "html",
    "css",
    "javascript",
    "js",
    "direction",
    "wordpress",
    "animation",
    "illustration",
    "photography",
    "photo",
    "movie",
    "video",
    "copywriting",
    "production",
    "art",
    "creative",
    "ux",
    "ui",
    "front-end",
    "frontend",
    "back-end",
    "backend",
    "development",
    "dev",
    "concept",
    "planning",
    "デザイン",
    "ディレクション",
    "コーディング",
    "撮影",
    "制作",
    "企画",
    "演出",
    "監修",
    "イラスト",
  ]);
  const isRoleLine = (line: string) => {
    // カッコがあったら人物行と判定
    if (/[（(].+[）)]/.test(line)) return false;
    // 短い (40文字以下) かつ 主に役割語のカンマ区切り
    if (line.length > 40) return false;
    const tokens = line
      .split(/[,、，&\/／+＋・　 ]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return false;
    const roleHits = tokens.filter((t) => roleWords.has(t)).length;
    return roleHits >= Math.ceil(tokens.length / 2);
  };

  // 「Tatsushi Fujiwara（Shinayaka design）」のような行から所属を抜く
  const parenAgencyRe = /[（(]\s*([^)）]+?)\s*[)）]\s*$/;
  // 役割行をスキップして人物行だけ集計
  const agencyCounts = new Map<string, number>();
  const personLines: string[] = [];

  for (const line of lines) {
    if (isRoleLine(line)) continue;
    // 「※敬称略」などの注釈行をスキップ
    if (/^[※\*]/.test(line)) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (line.length < 2) continue;

    const m = line.match(parenAgencyRe);
    if (m && m[1]) {
      const agency = m[1].trim();
      if (agency && agency.length <= 60) {
        agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
      }
    } else {
      personLines.push(line);
    }
  }

  // 最も登場頻度が高い所属を採用
  if (agencyCounts.size > 0) {
    const sorted = Array.from(agencyCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    return sorted[0][0];
  }

  // カッコ所属がなかったら人物名の先頭を採用
  if (personLines.length > 0) {
    const first = personLines[0];
    // 60文字以内に切る
    return first.length <= 60 ? first : first.slice(0, 60);
  }

  return null;
}

async function main() {
  const limit = parseInt(process.env.LIMIT || "0", 10);
  const force = process.env.FORCE === "1";
  const concurrency = parseInt(process.env.CONCURRENCY || "3", 10);
  const reqInterval = parseInt(process.env.INTERVAL_MS || "1000", 10);

  console.log("🏷  SANKOU! クレジット拡張パッチ開始");
  console.log("  limit:", limit || "all", "force:", force, "concurrency:", concurrency);
  console.log("=".repeat(50));

  const sites: ScrapedSite[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  console.log(`📊 既存データ: ${sites.length}件`);

  // 対象サイトを抽出: source=sankou で agency 空（または force）
  let targets = sites.filter(
    (s) => s.source === "sankou" && (force || !s.agency)
  );
  if (limit > 0) targets = targets.slice(0, limit);
  console.log(`🎯 対象: ${targets.length} 件`);
  if (targets.length === 0) {
    console.log("→ 何もすることなし");
    return;
  }

  let processed = 0;
  let updated = 0;
  let notFound = 0;
  const startedAt = Date.now();

  // 簡易ワーカープールで並列処理
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async (_, wi) => {
    while (cursor < targets.length) {
      const i = cursor++;
      const site = targets[i];

      try {
        // 1. WP REST API で post 検索 → detail URL
        const post = await searchSankouPostByTitle(site.title);
        if (!post?.link) {
          notFound++;
          continue;
        }

        // 2. 詳細ページから agency 抽出
        const agency = await fetchAgencyFromDetail(post.link);
        if (agency && agency.trim().length > 0) {
          site.agency = agency.trim();
          updated++;
        }
      } catch (e) {
        // 個別エラーは集計せず無視（再実行で拾う）
        void e;
      } finally {
        processed++;
        if (processed % 25 === 0 || processed === targets.length) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
          const rate = (processed / Math.max(1, parseFloat(elapsed))).toFixed(2);
          process.stdout.write(
            `\r  進捗 ${processed}/${targets.length}  更新${updated} 未検出${notFound} ${elapsed}s (${rate}/s)  `
          );
        }
      }

      // レート制限（worker 1 つあたり）
      await sleep(reqInterval);
    }
    void wi;
  });

  await Promise.all(workers);
  process.stdout.write("\n");

  // 5回のうち1回はバックアップ的に保存（中断時のため）
  // 最終保存
  fs.writeFileSync(DATA_PATH, JSON.stringify(sites, null, 2), "utf-8");

  // ソース別カバレッジ集計
  const coverage: Record<string, { total: number; withAgency: number }> = {};
  for (const s of sites) {
    coverage[s.source] = coverage[s.source] || { total: 0, withAgency: 0 };
    coverage[s.source].total++;
    if (s.agency && s.agency.trim()) coverage[s.source].withAgency++;
  }
  console.log("\n📈 クレジット カバレッジ:");
  for (const [src, c] of Object.entries(coverage)) {
    const pct = ((c.withAgency / c.total) * 100).toFixed(1);
    console.log(`  ${src}: ${c.withAgency}/${c.total} (${pct}%)`);
  }
  console.log(`\n✅ 完了 — 新規 agency: ${updated} 件`);
  console.log(`💾 保存: ${DATA_PATH}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
