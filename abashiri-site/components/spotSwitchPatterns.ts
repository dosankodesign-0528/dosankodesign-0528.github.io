/*
 * ぼーっとスポットの「1スクロールごとの写真切替」の見せ方 5案
 * （2026-08-21 ヒデさん指示。右下パネル「ぼーっとスポット｜切替の見せ方」で切替）
 *
 * どの案も共通：
 *   ・写真は全画面・固定のまま、スクロール1回ぶんで次の写真に切り替わる
 *   ・右下のテキストパネルも一緒に入れ替わる（出方は案ごとの質感に合わせる）
 * 違うのは「前の写真の消え方・次の写真の出方」だけ。
 */
import type { TargetAndTransition } from "framer-motion";

export type SpotSwitchPattern = {
  key: string;
  label: string;
  note: string;
  /** 入ってくる写真 */
  imgInitial: TargetAndTransition;
  imgAnimate: TargetAndTransition;
  /** 出ていく写真 */
  imgExit: TargetAndTransition;
  /** 切替にかける時間(秒) */
  duration: number;
  ease: number[] | string;
  /** テキストパネルの出方 */
  textInitial: TargetAndTransition;
  textAnimate: TargetAndTransition;
  /** テキストを写真より遅らせる(秒) */
  textDelay: number;
};

const EASE = [0.22, 1, 0.36, 1];

export const SPOT_SWITCH_PATTERNS: SpotSwitchPattern[] = [
  {
    key: "blur",
    label: "案1  ブラーで切替（シンプル）",
    note: "前の写真がにじんで消え、次がピントの合う形で現れる。KVからの流れと同じ言葉",
    imgInitial: { opacity: 0, filter: "blur(24px)", scale: 1.02 },
    imgAnimate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    imgExit: { opacity: 0, filter: "blur(24px)", scale: 1 },
    duration: 1.0,
    ease: EASE,
    textInitial: { opacity: 0, filter: "blur(12px)", y: 16 },
    textAnimate: { opacity: 1, filter: "blur(0px)", y: 0 },
    textDelay: 0.35,
  },
  {
    key: "drift",
    label: "案2  ゆっくり寄りながら溶ける",
    note: "次の写真が少し引きから寄りつつ、長めのクロスフェード。いちばんゆったり",
    imgInitial: { opacity: 0, scale: 1.08 },
    imgAnimate: { opacity: 1, scale: 1 },
    imgExit: { opacity: 0, scale: 1.02 },
    duration: 1.8,
    ease: "easeInOut",
    textInitial: { opacity: 0, y: 24 },
    textAnimate: { opacity: 1, y: 0 },
    textDelay: 0.7,
  },
  {
    key: "light",
    label: "案3  光にとける",
    note: "前の写真が白くまぶしく飛んで、その光の中から次が現れる。まぶたを閉じた感じ",
    imgInitial: { opacity: 0, filter: "brightness(2.2) blur(6px)" },
    imgAnimate: { opacity: 1, filter: "brightness(1) blur(0px)" },
    imgExit: { opacity: 0, filter: "brightness(2.2) blur(6px)" },
    duration: 1.3,
    ease: "easeInOut",
    textInitial: { opacity: 0, filter: "blur(8px)" },
    textAnimate: { opacity: 1, filter: "blur(0px)" },
    textDelay: 0.55,
  },
  {
    key: "rise",
    label: "案4  静かに持ち上がる",
    note: "次の写真が下からゆっくりせり上がって前を覆う。景色が流れていく感じ",
    imgInitial: { opacity: 1, y: "100%" },
    imgAnimate: { opacity: 1, y: "0%" },
    imgExit: { opacity: 1, y: "-18%", transitionEnd: { opacity: 0 } },
    duration: 1.4,
    ease: EASE,
    textInitial: { opacity: 0, y: 34 },
    textAnimate: { opacity: 1, y: 0 },
    textDelay: 0.75,
  },
  {
    key: "iris",
    label: "案5  まるく広がる",
    note: "次の写真が真ん中から円形にじわ〜っと広がる。目が覚めていくようなゆったり感",
    imgInitial: { opacity: 1, clipPath: "circle(0% at 50% 50%)" },
    imgAnimate: { opacity: 1, clipPath: "circle(75% at 50% 50%)" },
    imgExit: { opacity: 0 },
    duration: 1.6,
    ease: "easeInOut",
    textInitial: { opacity: 0, scale: 0.96 },
    textAnimate: { opacity: 1, scale: 1 },
    textDelay: 0.8,
  },
];

/* 採用案。⚠️ 2026-08-21 時点ではヒデさん未決のため案1（ブラー）を仮置き */
export const DEFAULT_SPOT_SWITCH = 1;

export function findSpotSwitch(v?: number | string | null): SpotSwitchPattern {
  if (typeof v === "string") {
    const hit = SPOT_SWITCH_PATTERNS.find((p) => p.key === v);
    if (hit) return hit;
  }
  const n = Number(v ?? DEFAULT_SPOT_SWITCH);
  return SPOT_SWITCH_PATTERNS[
    Math.min(Math.max(n, 1), SPOT_SWITCH_PATTERNS.length) - 1
  ];
}
