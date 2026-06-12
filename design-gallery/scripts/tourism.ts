/**
 * 観光（旅行・観光）サイトの判定と "travel" カテゴリ付与。
 *
 * 目的:
 *   すべてのキュレーションメディア（sankou / muuuuu / webdesignclip / 81web /
 *   s5style / awwwards）を横断して観光系サイトを拾い、サイドバーの
 *   「旅行・観光」フィルタ（Category キー = "travel"）で絞り込めるようにする。
 *
 * 仕組み:
 *   - 実データの category 文字列はメディアごとにバラバラ（"旅行･観光･遊び" /
 *     "trip" / "ホテル・旅館・宿泊" など）で、UI 側の enum キー "travel" とは
 *     一致しない。そこで観光と判定したサイトの category 配列に "travel" を足す。
 *   - SiteCard は category を表示しないので、キーを足してもカードの見た目は変わらない。
 *   - scraper.ts の保存直前に毎回 tagTourism() を呼ぶので、再スクレイプしても維持される。
 */

export const TOURISM_CATEGORY_KEY = "travel";

// 観光ポジティブ（category / title / url のどこかに出れば観光候補）
const POS =
  /観光|旅行|トラベル|travel|tourism|sightsee|ホテル|hotel|旅館|ryokan|温泉|onsen|リゾート|resort|宿泊|民宿|ペンション|pension|ゲストハウス|guest ?house|オーベルジュ|auberge|グランピング|glamping|道の駅|観光協会|観光局|別府|湯宿|秘湯|周遊|名所|クルーズ|cruise|航空|airline|フェリー|ferry|\btrip\b|\btour\b|journey|一棟貸し|泊まれる|映画村|温泉宿|宿\b/i;

// 除外（学校 / 建築 / 不動産 / EV 充電 / 物販グッズ / 音楽ツアー公演 などの誤検出を弾く）
const NEG =
  /専門学校|architect|建築設計|不動産|real ?estate|クリニック|病院|charging|charge ?trip|camper|採用|リクルート|recruit|フェリシモ|物産|通販|グッズ|求人|公演|追加公演|ワンマン|ライブツアー|アーティストツアー/i;

interface MinimalSite {
  title?: string;
  url?: string;
  category?: string[];
}

/** このサイトが観光系か */
export function isTourism(s: MinimalSite): boolean {
  const hay = `${(s.category || []).join(" ")} ${s.title || ""} ${s.url || ""}`;
  return POS.test(hay) && !NEG.test(hay);
}

/**
 * 観光判定に当たったサイトの category 配列に "travel" を足す（破壊的）。
 * 付与した件数を返す。
 */
export function tagTourism<T extends MinimalSite>(sites: T[]): number {
  let tagged = 0;
  for (const s of sites) {
    if (!isTourism(s)) continue;
    if (!Array.isArray(s.category)) s.category = [];
    if (!s.category.includes(TOURISM_CATEGORY_KEY)) {
      s.category.push(TOURISM_CATEGORY_KEY);
      tagged++;
    }
  }
  return tagged;
}
