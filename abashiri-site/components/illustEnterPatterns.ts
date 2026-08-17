/*
 * キービジュアルの演出が終わったあと、人物イラストが登場する時の5案。
 * /mock/illust-enter で並べて比べられる。
 *
 * 共通ルール
 * - 出るタイミングは今までどおり「全部そろった一番最後」（TopPage の合図を待つ）
 * - 着地点はカンプ位置 (1245, 764)。どの案も最後はそこでピタッと止まる
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

const STANDARD = [0.22, 1, 0.36, 1] as const;
const BOUNCE = [0.34, 1.56, 0.64, 1] as const;

export const ILLUST_ENTER_PATTERNS: IllustEnterPattern[] = [
  {
    key: "fade",
    label: "案1  ふわっと現れる",
    note: "ブラーが晴れながら静かに出る。v1.0 と同じ質感で、世界観を壊さない",
    initial: { opacity: 0, filter: "blur(16px)", x: 0, y: 0, rotate: 0, scale: 1 },
    animate: { opacity: 1, filter: "blur(0px)", x: 0, y: 0, rotate: 0, scale: 1 },
    transition: { duration: 1.1, ease: STANDARD },
    swingAfter: true,
  },
  {
    key: "walk",
    label: "案2  テクテク歩いてくる",
    note: "右端の外から歩いて入ってくる。上下に弾んで体も左右に傾く、いちばんコミカル",
    initial: { opacity: 1, filter: "blur(0px)", x: 260, y: 0, rotate: 0, scale: 1 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: [260, 195, 130, 68, 18, 0],
      /* 一歩ごとに体が浮いて落ちる */
      y: [0, -9, 0, -9, 0, 0],
      /* 重心の入れ替え。左右に振れながら進む */
      rotate: [0, -3.5, 3, -3, 1.5, 0],
      scale: 1,
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
    label: "案3  下からぴょこん",
    note: "画面の下から跳ね上がって、行き過ぎてから収まる。不意に顔を出す感じ",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0, scale: 1 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -18, 6, 0],
      rotate: [0, -2, 1, 0],
      scale: 1,
    },
    transition: {
      duration: 1.0,
      times: [0, 0.62, 0.82, 1],
      ease: ["easeOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "peek",
    label: "案4  ひょいと覗き込む",
    note: "右の外から横に出てきて、勢いで少し行き過ぎてから戻る。覗いている感じ",
    initial: { opacity: 1, filter: "blur(0px)", x: 210, y: 0, rotate: 0, scale: 1 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: [210, -16, 5, 0],
      y: 0,
      /* 顔を出す時に体を少し倒す */
      rotate: [6, -4, 1.5, 0],
      scale: 1,
    },
    transition: {
      duration: 1.15,
      times: [0, 0.6, 0.82, 1],
      ease: ["easeOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pon",
    label: "案5  ぽんっと出る",
    note: "その場で小さい状態から跳ねて出る。スタンプを押したような出方",
    initial: { opacity: 0, filter: "blur(0px)", x: 0, y: 0, rotate: 0, scale: 0.5 },
    animate: {
      opacity: [0, 1, 1, 1],
      filter: "blur(0px)",
      x: 0,
      y: 0,
      rotate: [-6, 2, -1, 0],
      scale: [0.5, 1.08, 0.97, 1],
    },
    transition: {
      duration: 0.85,
      times: [0, 0.55, 0.78, 1],
      ease: ["easeOut", "easeInOut", BOUNCE],
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
