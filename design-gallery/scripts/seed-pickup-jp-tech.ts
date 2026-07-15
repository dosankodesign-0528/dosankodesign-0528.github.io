/**
 * 日本のテック系企業×インタラクティブ表現のサイトを S5-Style アーカイブから
 * 「Pickup」ソースとしてシードするスクリプト（手動実行専用）。
 *
 * ヒデさん要望（2026-07-15）:
 *   日本のテック/デジタルサービス企業のサービスサイト・コーポレートサイトで、
 *   インタラクティブ表現があるスタイリッシュなもの。
 *
 * 背景:
 *   日次スクレイプは S5 の新着 500 件しか取らないが、アーカイブは 8,680 件ある。
 *   業種（テック系）×テイスト（スクロールエフェクト/パララックス/3D等）で絞ると
 *   2026-07-15 時点で未確認の新規が 666 件眠っていた。
 *
 * 仕組み:
 *   - S5 API を新しい順（id 降順）に走査
 *   - types/categories がテック系 AND styles がインタラクティブ系のものだけ採用
 *   - 既存 scraped-sites.json / Eagle 保存済みは除外
 *   - source は "pickup"（s5style にすると日次フルランで作り直されて消えるため。
 *     pickup は scraper.ts が常時引き継ぐ）
 *
 * 使い方:
 *   npx tsx scripts/seed-pickup-jp-tech.ts
 *   SEED_TARGET=200 npx tsx scripts/seed-pickup-jp-tech.ts
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeUrl } from "../src/lib/eagle";

const SEED_TARGET = parseInt(process.env.SEED_TARGET || "200", 10);
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// 業種ティア1: 会社そのものがテック/デジタルサービス系と分かるラベル。
// 「プロダクトサイト」「特設サイト」だけのラベルは酒蔵・小売等が混ざるので使わない
//（2026-07-15 初回シードで七賢/PARCO が混入 → 取り直した教訓）。
const TECH_STRICT_RE =
  /IT･?コンピューター|テクノロジー|Webアプリ|SaaS|ソフトウェア|情報・?WEBサービス|WEB・?情報サービス|スタートアップ|HR･タレント/i;
// 業種ティア2: サービスサイト型（デジタルサービスのことが多いが確度は下がる）。
// ティア1で目標に届かない分だけここから補充する。
const TECH_LOOSE_RE = /サービスサイト|アプリ/i;
// テイスト: インタラクティブ表現（S5 の styles ラベル）
const INTERACTIVE_RE = /スクロールエフェクト|パララックス|3D|動画|グラフィカル/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchEagleUrls(): Promise<Set<string>> {
  const result = new Set<string>();
  try {
    const res = await fetch("http://localhost:41595/api/item/list?limit=100000");
    if (!res.ok) return result;
    const json = (await res.json()) as { data?: Array<{ url?: string; website?: string }> };
    for (const it of json.data || []) {
      const u = it.url || it.website;
      if (u) result.add(normalizeUrl(u));
    }
  } catch {
    // Eagle 不在なら除外なし
  }
  return result;
}

interface S5Tag { label: string }
interface S5Item {
  title: string;
  site_url: string;
  images: { l?: string; m?: string; s?: string };
  categories: S5Tag[];
  styles: S5Tag[];
  types: S5Tag[];
}

async function main() {
  console.log(`🇯🇵 日本テック×インタラクティブ シード開始（目標 ${SEED_TARGET} 件）`);

  const dataPath = path.join(__dirname, "..", "src", "data", "scraped-sites.json");
  const metaPath = path.join(__dirname, "..", "src", "data", "scrape-meta.json");
  const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const known = new Set(existing.map((x: { url: string }) => normalizeUrl(x.url)));
  const eagle = await fetchEagleUrls();
  console.log(`Eagle 除外対象: ${eagle.size} 件`);

  const now = new Date().toISOString();
  const todayMonth = now.slice(0, 7);
  const tier1: Record<string, unknown>[] = [];
  const tier2: Record<string, unknown>[] = [];

  for (let offset = 0; offset < 8700 && tier1.length < SEED_TARGET; offset += 100) {
    let json: { items: S5Item[] };
    try {
      const res = await fetch(`https://api.s5-style.com/posts/?offset=${offset}&limit=100`, {
        headers: { "User-Agent": UA, Referer: "https://www.s5-style.com/" },
      });
      if (!res.ok) break;
      json = (await res.json()) as { items: S5Item[] };
    } catch {
      break;
    }
    if (!json.items?.length) break;

    for (const it of json.items) {
      if (tier1.length >= SEED_TARGET) break;
      if (!it.site_url || !it.title) continue;
      const cats = [...(it.types || []), ...(it.categories || [])].map((t) => t.label);
      const styles = (it.styles || []).map((s) => s.label);
      const catStr = cats.join(" ");
      const isTier1 = TECH_STRICT_RE.test(catStr);
      const isTier2 = !isTier1 && TECH_LOOSE_RE.test(catStr);
      if (!isTier1 && !isTier2) continue;
      if (!INTERACTIVE_RE.test(styles.join(" "))) continue;
      const thumb = it.images?.l || it.images?.m || it.images?.s;
      if (!thumb) continue;
      const k = normalizeUrl(it.site_url);
      if (known.has(k) || eagle.has(k)) continue;
      known.add(k);
      const entry = {
        id: crypto.createHash("md5").update(`pickup:${it.site_url}`).digest("hex").slice(0, 12),
        title: it.title.slice(0, 100),
        url: it.site_url,
        thumbnailUrl: thumb,
        source: "pickup",
        category: cats.slice(0, 5),
        taste: styles.slice(0, 5),
        date: todayMonth, // S5 API は掲載日を返さない
        starred: false,
        firstSeen: now,
      };
      (isTier1 ? tier1 : tier2).push(entry);
    }
    if (offset % 1000 === 0 && offset > 0)
      console.log(`  offset ${offset}: ティア1 ${tier1.length} / ティア2 ${tier2.length}`);
    await sleep(400);
  }

  // ティア1（テック企業確定）を優先し、足りない分だけティア2（サービスサイト型）で補充
  const out = [...tier1.slice(0, SEED_TARGET), ...tier2.slice(0, Math.max(0, SEED_TARGET - tier1.length))];
  console.log(`  採用: ティア1 ${Math.min(tier1.length, SEED_TARGET)} / ティア2 ${out.length - Math.min(tier1.length, SEED_TARGET)}`);

  existing.push(...out);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf-8");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ scrapedAt: now, newlyDetected: out.length }, null, 2) + "\n",
    "utf-8"
  );
  console.log(`\n✅ シード完了: +${out.length} 件 / 総 ${existing.length} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
