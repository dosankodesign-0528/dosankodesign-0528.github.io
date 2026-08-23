/*
 * 人物イラスト「たまんねーっ」の眉毛のベクターデータ。
 *
 * イラスト本体は public/img/illust-main.png をそのまま使う（元絵の質感を落とさないため）。
 * 動かしたいのは眉毛だけなので、眉の形だけ potrace でトレースして切り出してある。
 * 生成スクリプトは scripts/illust-trace.py。手で書き換えないこと。
 *
 * 座標系: 元PNGと同じ 637x800。FLIP を掛けた内側で使う（potrace のY反転ぶん）。
 *
 * 重ね方（下 → 上）:
 *   illust-main.png → 元の眉を隠す肌色パッチ（動かない） → 動く眉
 * パッチは眉と同じ形を少し太らせたもの。眉が上がった時に、元の眉の跡が残らない。
 *
 * ※ 以前は全体をトレースして黒目も動かしていたが、元絵より線が甘くなるので取りやめた。
 *   その時のフルデータは git 履歴（db5fcd1）に残っている。
 */

/** potrace 出力（10倍・Y反転）を元PNGの座標系に戻す変換 */
export const ILLUST_FLIP = "translate(0,800) scale(0.1,-0.1)";

export const ILLUST_VIEWBOX = { w: 637, h: 800 } as const;

/** 眉の色 */
export const BROW_FILL = "#232222";

/** 元の眉を隠すパッチの色（額の肌色） */
export const SKIN_FILL = "#FCE4D3";

/**
 * パッチをどれだけ太らせるか。ILLUST_FLIP の中の単位なので、
 * 画面上では ×0.1 ×(表示幅/637) になる。70 で約3px ぶん。
 */
export const PATCH_SPREAD = 70;

export const BROW_D = {
  left: [
    "M2045 5950 c-28 -45 163 -183 334 -241 69 -24 91 -24 91 0 0 24 -13 33 -75 56 -99 35 -193 87 -254 141 -62 53 -84 64 -96 44z",
  ],
  right: [
    "M3729 5735 c-74 -40 -172 -57 -369 -64 -185 -6 -195 -7 -195 -26 0 -27 30 -33 170 -34 234 -2 484 65 462 123 -8 20 -33 20 -68 1z",
  ],
} as const;

/** 左右まとめた眉のパス */
export const BROW_ALL: readonly string[] = [...BROW_D.left, ...BROW_D.right];
