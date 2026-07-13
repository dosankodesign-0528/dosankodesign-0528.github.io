/**
 * 住宅・建築（住宅・家具・建築・インテリア・不動産）サイトの判定と
 * "housing" カテゴリ付与。
 *
 * 目的:
 *   ヒデさんが住宅系サイトを制作するため、参考になる住宅・家具・建築・
 *   インテリア・不動産系サイトを全メディア横断で拾い、フィルターバーの
 *   「住宅・建築」ワンタップピル（Category キー = "housing"）で
 *   絞り込めるようにする。
 *
 * 仕組み:
 *   - 実データの category 文字列はメディアごとにバラバラ（"建築・住宅・不動産・オフィス" /
 *     "Real Estate" / "インテリア・家具・雑貨" など）で、UI 側の enum キー "housing" とは
 *     一致しない。そこで住宅系と判定したサイトの category 配列に "housing" を足す。
 *   - SiteCard は category を表示しないので、キーを足してもカードの見た目は変わらない。
 *   - scraper.ts の保存直前に毎回 tagHousing() を呼ぶので、再スクレイプしても維持される。
 */

export const HOUSING_CATEGORY_KEY = "housing";

// 住宅ポジティブ（category / title のどこかに出れば住宅候補）
const POS =
  /住宅|注文住宅|家づくり|家具|建築|建設|インテリア|不動産|リノベ|リフォーム|工務店|住まい|暮らし|内装|建材|家電?具|マンション|一戸建|木材|architecture|architect|interior|furniture|real.?estate|housing|renovation|\bhouse\b|\bhome\b|living/i;

// 除外（学校 / 美容 / 病院 / 求人 / 〜家（作家・専門家など）/ HP 表記 などの誤検出を弾く）
const NEG =
  /専門学校|美容|病院|クリニック|求人|採用|作家|専門家|音楽家|写真家|画家|homepage|home ?page/i;

interface MinimalSite {
  title?: string;
  url?: string;
  category?: string[];
}

/** このサイトが住宅・建築系か */
export function isHousing(s: MinimalSite): boolean {
  const hay = `${(s.category || []).join(" ")} ${s.title || ""}`;
  return POS.test(hay) && !NEG.test(hay);
}

/**
 * 住宅判定に当たったサイトの category 配列に "housing" を足す（破壊的）。
 * 付与した件数を返す。
 */
export function tagHousing<T extends MinimalSite>(sites: T[]): number {
  let tagged = 0;
  for (const s of sites) {
    if (!isHousing(s)) continue;
    if (!Array.isArray(s.category)) s.category = [];
    if (!s.category.includes(HOUSING_CATEGORY_KEY)) {
      s.category.push(HOUSING_CATEGORY_KEY);
      tagged++;
    }
  }
  return tagged;
}
