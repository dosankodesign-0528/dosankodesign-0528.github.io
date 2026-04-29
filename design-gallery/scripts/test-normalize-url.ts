/**
 * normalizeUrl の動作確認テスト（手動実行用）
 *   npx tsx scripts/test-normalize-url.ts
 */
import { normalizeUrl } from "../src/lib/eagle";

const cases: { a: string; b: string; sameExpected: boolean }[] = [
  // 同じサイト扱いにすべきペア
  { a: "https://example.com/", b: "https://example.com", sameExpected: true },
  { a: "https://example.com/", b: "https://www.example.com/", sameExpected: true },
  { a: "https://example.com/?utm_source=twitter", b: "https://example.com/", sameExpected: true },
  { a: "https://example.com/?fbclid=xxx&utm_campaign=yyy", b: "https://example.com/", sameExpected: true },
  { a: "https://example.com/page", b: "https://example.com/page/", sameExpected: true },
  { a: "https://example.com/index.html", b: "https://example.com/", sameExpected: true },
  { a: "https://example.com/about/index.php", b: "https://example.com/about/", sameExpected: true },
  { a: "https://example.com/page#section", b: "https://example.com/page", sameExpected: true },
  { a: "http://example.com/", b: "https://example.com/", sameExpected: true },
  { a: "https://example.com/?b=2&a=1", b: "https://example.com/?a=1&b=2", sameExpected: true },
  // 別サイトとして残してほしいペア
  { a: "https://example.com/?lang=ja", b: "https://example.com/?lang=en", sameExpected: false },
  { a: "https://example.com/page1", b: "https://example.com/page2", sameExpected: false },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const na = normalizeUrl(c.a);
  const nb = normalizeUrl(c.b);
  const actualSame = na === nb;
  const ok = actualSame === c.sameExpected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "✓" : "✗"}  ${c.sameExpected ? "同じ" : "別物"}  ${c.a}  vs  ${c.b}`);
  if (!ok) console.log(`   実: ${na}  vs  ${nb}`);
}
console.log(`\n結果: ${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
