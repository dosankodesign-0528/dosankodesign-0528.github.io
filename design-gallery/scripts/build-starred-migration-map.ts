/**
 * ✓（確認済み）のURL移行用: 「過去に存在したが現データから消えたサイトID」→
 * 正規化URL の対応表を Git 履歴から生成する。
 *
 * 背景（2026-07-18）:
 *   ✓は localStorage に id=md5(source:url) の集合で保存されていたが、
 *   日次スクレイプの入れ替えで項目がデータから消えると、そのIDに対応する
 *   URLが分からなくなり、後日同じサイトが別ソースで復活したとき✓が外れていた。
 *   ✓をURLキーへ移行するにあたり、消えたIDも過去のscraped-sites.jsonから
 *   引けるだけ引いてURLに変換できるようにする。
 *
 * 出力: public/starred-id-url-map.json （{ 消えたid: 正規化URL }）
 *   - 現データに存在するIDは含めない（クライアントがローカルで解決できるため）
 *   - クライアントは移行時に一度だけ fetch し、以後は参照しない
 *
 * 使い方: npx tsx scripts/build-starred-migration-map.ts
 *   （このリポジトリは親リポの subdir なので git は -C .. で叩く）
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

const REPO_ROOT = path.join(__dirname, "..", "..");
const DATA_REL = "design-gallery/src/data/scraped-sites.json";
// 日次コミットが主なので3コミットおきのサンプリングで十分カバーできる
// （サイトは何週間もデータに残り続けるため取りこぼしがほぼ無い）
const MAX_COMMITS = 150;
const SAMPLE_EVERY = 3;

function main() {
  const hashes = execSync(
    `git -C "${REPO_ROOT}" log --format=%H -n ${MAX_COMMITS} -- ${DATA_REL}`,
    { encoding: "utf-8" }
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((_, i) => i % SAMPLE_EVERY === 0);

  console.log(`対象コミット: ${hashes.length} 件（${MAX_COMMITS}件から${SAMPLE_EVERY}おき）`);

  const map = new Map<string, string>();
  let parsed = 0;
  for (const h of hashes) {
    try {
      const raw = execSync(`git -C "${REPO_ROOT}" show ${h}:${DATA_REL}`, {
        encoding: "utf-8",
        maxBuffer: 1024 * 1024 * 300,
      });
      const arr = JSON.parse(raw) as Array<{ id?: string; url?: string }>;
      for (const e of arr) {
        if (!e.id || !e.url) continue;
        if (!map.has(e.id)) map.set(e.id, normalizeUrl(e.url));
      }
      parsed++;
    } catch {
      // 壊れたコミット・巨大すぎる場合はスキップ
    }
  }
  console.log(`パース成功: ${parsed}/${hashes.length} コミット / 累積ID: ${map.size}`);

  // 現データに居るIDは除外（クライアント側でローカル解決できる）
  const current = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "src", "data", "scraped-sites.json"), "utf-8")
  ) as Array<{ id: string }>;
  for (const e of current) map.delete(e.id);

  const outPath = path.join(__dirname, "..", "public", "starred-id-url-map.json");
  fs.writeFileSync(outPath, JSON.stringify(Object.fromEntries(map)), "utf-8");
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`✅ 消えたID対応表: ${map.size} 件 → ${outPath} (${kb}KB)`);
}

main();
