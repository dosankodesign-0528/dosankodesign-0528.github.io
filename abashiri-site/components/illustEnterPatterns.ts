/*
 * キービジュアルの演出が終わったあと、人物イラストが登場する時の案。
 * /mock/illust-enter で並べて比べられる。
 *
 * 2026-08-17 に「テクテク歩いてくる」「下からぴょこん」の2案に絞られたあと、
 * 2026-08-20 に「ぴょこんのバリエーションを5つ」との指示で案2〜案6を用意した。
 * どれも画面の下（見えない位置）から跳ね上がる。違うのは跳ね方の性格だけ。
 *
 * 共通ルール
 * - 出るタイミングは「全部そろった一番最後」（TopPage の合図を待つ）
 * - 着地点はカンプ位置 (1245, 764)。どちらも最後はそこでピタッと止まる
 * - 動く量はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px
 */
import type { Transition, TargetAndTransition } from "framer-motion";

export type IllustEnterPattern = {
  key: string;
  label: string;
  note: string;
  /** 出る前の状態 */
  initial: TargetAndTransition;
  /** 着地までのキーフレーム */
  animate: TargetAndTransition;
  transition: Transition;
  /** 登場が終わってから、いつもの15秒おきスイングを始めるか */
  swingAfter: boolean;
};

export const ILLUST_ENTER_PATTERNS: IllustEnterPattern[] = [
  {
    key: "walk",
    label: "案1  テクテク歩いてくる",
    note: "右端の外から歩いて入ってくる。一歩ごとに体が浮いて、左右に振れながら進む",
    initial: { opacity: 1, filter: "blur(0px)", x: 260, y: 0, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: [260, 195, 130, 68, 18, 0],
      /* 一歩ごとに体が浮いて落ちる */
      y: [0, -9, 0, -9, 0, 0],
      /* 重心の入れ替え。左右に振れながら進む */
      rotate: [0, -3.5, 3, -3, 1.5, 0],
    },
    transition: {
      duration: 2.0,
      times: [0, 0.2, 0.4, 0.6, 0.82, 1],
      ease: ["easeOut", "easeInOut", "easeInOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon",
    label: "案2  ぴょこん（標準）",
    note: "下から跳ね上がって、行き過ぎてから収まる。今までの動きそのまま",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -18, 6, 0],
      rotate: [0, -2, 1, 0],
    },
    transition: {
      duration: 1.0,
      times: [0, 0.62, 0.82, 1],
      ease: ["easeOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-snap",
    label: "案3  ビュンと出てピタッ（メリハリ）",
    note: "速く飛び出して大きく行き過ぎ、一気に着地。キレのあるメリハリ重視",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -30, 3, 0],
      rotate: [0, -4, 1.5, 0],
    },
    transition: {
      duration: 0.72,
      times: [0, 0.5, 0.78, 1],
      ease: ["easeOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-double",
    label: "案4  トントンッと2段跳ね",
    note: "小さく1回・大きく1回の2段階で跳ねる。リズム感・コミカル",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -8, 4, -18, 3, 0],
      rotate: [0, -1.5, 0.5, -2.5, 1, 0],
    },
    transition: {
      duration: 1.25,
      times: [0, 0.3, 0.46, 0.68, 0.86, 1],
      ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-peek",
    label: "案5  ちら見してからぴょこん",
    note: "頭だけちょこっと出して一拍ため、それから勢いよく飛び出す。じらし",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, 150, 150, -22, 5, 0],
      rotate: [0, 0, 0, -3, 1, 0],
    },
    transition: {
      duration: 1.6,
      times: [0, 0.2, 0.48, 0.74, 0.9, 1],
      ease: ["easeOut", "linear", "easeInOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-soft",
    label: "案6  ゆったりせり上がって最後にぴょこ",
    note: "ゆっくりせり上がってきて、最後だけ小さく跳ねて着地。おだやか",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, 26, -10, 0],
      rotate: [0, 0, -1.5, 0],
    },
    transition: {
      duration: 1.5,
      times: [0, 0.6, 0.85, 1],
      ease: ["easeInOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
];

/* 採用案：案2「ぴょこん（標準）」（2026-08-18 ヒデさん指示）。
   案3〜案6 は 2026-08-20 に追加したバリエーション。/mock/illust-enter で見比べて、
   決まったらここを差し替える。 */
export const DEFAULT_ILLUST_ENTER = ILLUST_ENTER_PATTERNS[1];

export function findIllustEnter(key?: string | number | null): IllustEnterPattern {
  if (key == null) return DEFAULT_ILLUST_ENTER;
  const byIndex = ILLUST_ENTER_PATTERNS[Number(key) - 1];
  return (
    byIndex ??
    ILLUST_ENTER_PATTERNS.find((p) => p.key === key) ??
    DEFAULT_ILLUST_ENTER
  );
}
