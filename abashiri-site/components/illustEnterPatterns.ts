/*
 * キービジュアルの演出が終わったあと、人物イラストが登場する時の案。
 * /mock/illust-enter で並べて比べられる。
 *
 * 5案のうち「テクテク歩いてくる」「下からぴょこん」の2案が残った（2026-08-17 ヒデさん選定）。
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
    label: "案2  下からぴょこん",
    note: "画面の下から跳ね上がって、行き過ぎてから収まる。不意に顔を出す感じ",
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
];

export const DEFAULT_ILLUST_ENTER = ILLUST_ENTER_PATTERNS[0];

export function findIllustEnter(key?: string | number | null): IllustEnterPattern {
  if (key == null) return DEFAULT_ILLUST_ENTER;
  const byIndex = ILLUST_ENTER_PATTERNS[Number(key) - 1];
  return (
    byIndex ??
    ILLUST_ENTER_PATTERNS.find((p) => p.key === key) ??
    DEFAULT_ILLUST_ENTER
  );
}
