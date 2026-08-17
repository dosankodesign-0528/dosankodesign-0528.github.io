/*
 * 人物イラストにカーソルを乗せた時の「眉が上がる ＋ たまらねー がひょこっと出る」5案。
 * /mock/tamaranee で並べて比べられる。
 *
 * 共通ルール
 * - 眉の持ち上げ量は faceConfig.browLift（既定5px）。案ごとに「上がり方の速さ」だけ変える
 * - 文字は右上に置いてあり、出方（transform / opacity / blur）だけを案ごとに変える
 * - 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px
 */
export type TamaraneePattern = {
  key: string;
  label: string;
  /** 何が違うのかの一言 */
  note: string;
  /** 眉が持ち上がるまでの時間(ms)とイージング */
  brow: { duration: number; ease: string };
  /** 文字の出方。off = 消えている時、on = 出ている時 */
  text: {
    duration: number;
    /** 遅らせて「ワンテンポ置いて出る」感じを作る(ms) */
    delay: number;
    ease: string;
    /** transform-origin。跳ねの支点 */
    origin: string;
    off: React.CSSProperties;
    on: React.CSSProperties;
  };
};

const STANDARD = "cubic-bezier(0.22, 1, 0.36, 1)";
/** 行き過ぎてから戻る＝「ひょこっ」の正体 */
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const TAMARANEE_PATTERNS: TamaraneePattern[] = [
  {
    key: "hyoko",
    label: "案1  ひょこっ",
    note: "下から跳ね上がって、行き過ぎてから収まる。いちばん「ひょこっ」らしい",
    brow: { duration: 260, ease: OVERSHOOT },
    text: {
      duration: 460,
      delay: 60,
      ease: OVERSHOOT,
      origin: "50% 100%",
      off: { opacity: 0, transform: "translateY(14px) scale(0.7)" },
      on: { opacity: 1, transform: "translateY(0) scale(1)" },
    },
  },
  {
    key: "fuwa",
    label: "案2  ふわっ",
    note: "ブラーが晴れながらゆっくり浮かぶ。サイトの登場演出と同じ質感",
    brow: { duration: 380, ease: STANDARD },
    text: {
      duration: 700,
      delay: 80,
      ease: STANDARD,
      origin: "50% 100%",
      off: { opacity: 0, filter: "blur(10px)", transform: "translateY(8px)" },
      on: { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" },
    },
  },
  {
    key: "kururi",
    label: "案3  くるっ",
    note: "傾いた状態から回りながら出る。手で書き足したような勢いが出る",
    brow: { duration: 300, ease: OVERSHOOT },
    text: {
      duration: 520,
      delay: 40,
      ease: OVERSHOOT,
      origin: "10% 100%",
      off: { opacity: 0, transform: "rotate(-18deg) scale(0.6)" },
      on: { opacity: 1, transform: "rotate(0deg) scale(1)" },
    },
  },
  {
    key: "paki",
    label: "案4  ぱっ",
    note: "フェードなしの1コマ。カモメやキラキラと同じGIF風のカクつき",
    brow: { duration: 0, ease: "linear" },
    text: {
      duration: 0,
      delay: 90,
      ease: "linear",
      origin: "50% 100%",
      off: { opacity: 0, transform: "translateY(6px)" },
      on: { opacity: 1, transform: "translateY(0)" },
    },
  },
  {
    key: "nobi",
    label: "案5  のびっ",
    note: "左から書き出すように横へ伸びる。手書きが進むように見える",
    brow: { duration: 320, ease: STANDARD },
    text: {
      duration: 560,
      delay: 60,
      ease: STANDARD,
      origin: "0% 60%",
      off: { opacity: 0, transform: "scaleX(0.2) scaleY(0.85)" },
      on: { opacity: 1, transform: "scaleX(1) scaleY(1)" },
    },
  },
];

export const DEFAULT_TAMARANEE = TAMARANEE_PATTERNS[0];

export function findTamaranee(key?: string | number | null): TamaraneePattern {
  if (key == null) return DEFAULT_TAMARANEE;
  const byIndex = TAMARANEE_PATTERNS[Number(key) - 1];
  return byIndex ?? TAMARANEE_PATTERNS.find((p) => p.key === key) ?? DEFAULT_TAMARANEE;
}
