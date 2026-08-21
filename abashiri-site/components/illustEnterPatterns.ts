/*
 * キービジュアルの演出が終わったあと、人物イラストが登場する時の案。
 * /mock/illust-enter で並べて比べられる。
 *
 * 変遷：
 *   2026-08-17 「歩き」「ぴょこん」の2案に絞る → 2026-08-20 ぴょこん5案
 *   2026-08-21 ぴょこん（旧案2）で確定。歩き・旧案3〜6は削除し、
 *              「メリハリの強いバウンス」系のバリエーション3つを追加した
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
    key: "pyokon",
    label: "案1  ぴょこん（採用中の標準）",
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
    key: "pyokon-sharp",
    label: "案2  ビュンッ→ピタッ",
    note: "速く大きく飛び出して、一気に着地。いちばんキレのあるメリハリ",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -34, 4, 0],
      rotate: [0, -5, 2, 0],
    },
    transition: {
      duration: 0.66,
      times: [0, 0.48, 0.76, 1],
      ease: ["easeOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-tame",
    label: "案3  タメて→ドンッ",
    note: "一瞬タメてから爆発的に跳ぶ。高く行き過ぎて、弾んで収まる",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, 240, -30, 8, -4, 0],
      rotate: [0, 0, -4, 2, -1, 0],
    },
    transition: {
      duration: 1.0,
      times: [0, 0.18, 0.5, 0.72, 0.86, 1],
      ease: ["linear", "easeOut", "easeInOut", "easeInOut", "easeOut"],
    },
    swingAfter: true,
  },
  {
    key: "pyokon-dandan",
    label: "案4  ダンダンッと2度弾み",
    note: "強く1回・小さく1回、リズムよく2度弾んで止まる。歯切れ重視",
    initial: { opacity: 1, filter: "blur(0px)", x: 0, y: 240, rotate: 0 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: [240, -26, 6, -12, 2, 0],
      rotate: [0, -3, 1.5, -2, 1, 0],
    },
    transition: {
      duration: 0.9,
      times: [0, 0.4, 0.6, 0.78, 0.92, 1],
      ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut"],
    },
    swingAfter: true,
  },
];

/* 採用案：案1「ぴょこん（標準）」（2026-08-21 ヒデさん確定）。
   案2〜4 はメリハリ強めのバリエーション。乗り換えるならここを差し替える */
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
