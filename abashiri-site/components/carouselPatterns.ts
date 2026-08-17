/*
 * 場所えらびカルーセルの動き方 3案。
 * /mock/carousel で並べて比べられる。
 *
 * 共通の仕様（2026-08-17 ヒデさん決定）
 * - 選べるのは中央に来たカードだけ。左右のカードにはボタンを出さない
 * - 中央に来たカードだけが拡大し、「この場所にする」が出る
 * - 流れる向きは右から左（カンプどおり）
 *
 * 違うのは「間の取り方」だけ。
 */
export type CarouselPattern = {
  key: string;
  label: string;
  note: string;
  /** true: 止まらずに流れ続け、中央を通過中のカードが拡大する */
  continuous: boolean;
  /** 中央で止まっている時間(ms)。continuous では使わない */
  dwell: number;
  /** 次のカードへ滑る時間(ms) */
  slide: number;
  /** framer-motion 用の cubic-bezier 4値 */
  ease: [number, number, number, number];
};

const STANDARD: [number, number, number, number] = [0.22, 1, 0.36, 1];
const GLIDE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const LINEAR_ISH: [number, number, number, number] = [0.35, 0.15, 0.65, 0.85];

export const CAROUSEL_PATTERNS: CarouselPattern[] = [
  {
    key: "dwell",
    label: "案1  ゆっくり流れて、中央で止まる",
    note: "1枚ずつ中央へ来て、4秒たっぷり見せてから次へ。いちばん落ち着いて選べる",
    continuous: false,
    dwell: 4000,
    slide: 1600,
    ease: STANDARD,
  },
  {
    key: "flow",
    label: "案2  止まらずに流れ続ける",
    note: "ずっとゆっくり流れていて、中央を通ったカードがそのつど拡大する。いちばん「ぼーっ」に近い",
    continuous: true,
    dwell: 0,
    slide: 5200,
    ease: LINEAR_ISH,
  },
  {
    key: "linger",
    label: "案3  長めに止まって、すっと切り替わる",
    note: "7秒じっくり見せて、切り替わりは1秒でさっと。1枚ずつ味わう感じが強い",
    continuous: false,
    dwell: 7000,
    slide: 1000,
    ease: GLIDE,
  },
];

export const DEFAULT_CAROUSEL = CAROUSEL_PATTERNS[0];

export function findCarousel(key?: string | number | null): CarouselPattern {
  if (key == null) return DEFAULT_CAROUSEL;
  const byIndex = CAROUSEL_PATTERNS[Number(key) - 1];
  return (
    byIndex ?? CAROUSEL_PATTERNS.find((p) => p.key === key) ?? DEFAULT_CAROUSEL
  );
}
