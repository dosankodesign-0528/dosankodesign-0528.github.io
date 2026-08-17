/*
 * 「この場所にする」を押してから動画の世界に入るまでのズームイン演出 5案。
 * /mock/enter で並べて比べられる。
 *
 * 共通の仕組み（どの案も同じ。違うのは効き方だけ）
 * - 選んだカードが「窓枠」。窓の開口部だけが広がって、画面いっぱいを覆う
 * - 窓の向こうの景色は画面に貼り付いたまま。開口部が動いたぶんだけ中で逆に動かす
 * - 景色は parallax の量だけ“わずかに”しか動かない。
 *   枠が大きく広がるのに景色はほぼ動かない、この差が奥行きになる
 * - 終点は器の実寸から計算する（1512 の固定値で出すと横長の画面で左上にずれる）
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 */
export type EnterPattern = {
  key: string;
  label: string;
  note: string;
  /** 全体の尺(ms)。この時間が終わったら動画画面に切り替わる */
  duration: number;
  /** 開口部の「位置」の動き方。どこから寄るか */
  ease: [number, number, number, number];
  /** 開口部の「大きさ」の動き方。ここが寄りの体感を決める */
  growEase: [number, number, number, number];
  /** 窓の向こうの景色の視差。1 に近いほど景色が動かない＝奥行きが強い */
  parallax: number;
  /** 角丸(px)。窓枠が外れていく */
  radius: [number, number];
  /** 白フチ(px) */
  border: [number, number];
  /** 途中で入れるブラー(px)。[開始, 中盤, 終了] */
  blur: [number, number, number];
  /** 周囲を暗く落とす量(0-1)。トンネル感を出す */
  dim: number;
};

const STANDARD: [number, number, number, number] = [0.22, 1, 0.36, 1];
/* 出だしをうんと殺して、終盤で一気に加速する。
   等速で歩いて窓に近づくと、見た目の大きさは終盤ほど急激に増える。
   この「最初はほとんど動かない → 最後にぐっと吸い込まれる」が吸引感の正体。 */
const SUCK: [number, number, number, number] = [0.9, 0, 0.92, 0.35];

export const ENTER_PATTERNS: EnterPattern[] = [
  {
    key: "tunnel",
    label: "吸い込まれる",
    note: "最初はほとんど動かず、終盤で一気に加速して吸い込まれる。まわりは暗く落ちる",
    duration: 1900,
    ease: STANDARD,
    growEase: SUCK,
    /* 景色をほぼ止めることで、枠だけが猛烈に迫ってくるように見せる */
    parallax: 1.05,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0.62,
  },
];

export const DEFAULT_ENTER = ENTER_PATTERNS[0];

export function findEnter(key?: string | number | null): EnterPattern {
  if (key == null) return DEFAULT_ENTER;
  const byIndex = ENTER_PATTERNS[Number(key) - 1];
  return byIndex ?? ENTER_PATTERNS.find((p) => p.key === key) ?? DEFAULT_ENTER;
}
