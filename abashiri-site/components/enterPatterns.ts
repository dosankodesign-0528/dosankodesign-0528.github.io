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
/* 出だしゆっくり→終盤に加速。等速で歩いて近づくと見た目の大きさは加速して増える */
const ACCEL: [number, number, number, number] = [0.55, 0, 0.85, 0.6];
const ACCEL_HARD: [number, number, number, number] = [0.7, 0, 0.9, 0.5];
const EVEN: [number, number, number, number] = [0.4, 0.1, 0.6, 0.9];
const SETTLE: [number, number, number, number] = [0.5, 0, 0.15, 1];

export const ENTER_PATTERNS: EnterPattern[] = [
  {
    key: "straight",
    label: "案1  まっすぐ入る",
    note: "一定の歩幅で窓へ。角丸とフチが外れて全画面になる。いちばん素直で、どこにも引っかからない",
    duration: 1400,
    ease: STANDARD,
    growEase: ACCEL,
    parallax: 1.14,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0,
  },
  {
    key: "tunnel",
    label: "案2  吸い込まれる",
    note: "まわりが暗く落ちて、終盤ぐっと加速する。トンネルをくぐる感じがいちばん強い",
    duration: 1600,
    ease: STANDARD,
    growEase: ACCEL_HARD,
    parallax: 1.06,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0.55,
  },
  {
    key: "window",
    label: "案3  窓が開いてから入る",
    note: "先に白フチと角丸だけスッと消えて、ワンテンポ置いてから世界が広がる",
    duration: 1700,
    ease: STANDARD,
    growEase: SETTLE,
    parallax: 1.2,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0.2,
  },
  {
    key: "focus",
    label: "案4  ピントが合う",
    note: "一度ぼやけてから晴れる。目が慣れていくような、いちばんのんびりした入り方",
    duration: 1800,
    ease: STANDARD,
    growEase: ACCEL,
    parallax: 1.24,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 16, 0],
    dim: 0.15,
  },
  {
    key: "drift",
    label: "案5  ゆっくり流れ込む",
    note: "等速に近い長い尺。急かされない、引きのいちばん強い入り方",
    duration: 2400,
    ease: EVEN,
    growEase: EVEN,
    parallax: 1.3,
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 6, 0],
    dim: 0.3,
  },
];

export const DEFAULT_ENTER = ENTER_PATTERNS[0];

export function findEnter(key?: string | number | null): EnterPattern {
  if (key == null) return DEFAULT_ENTER;
  const byIndex = ENTER_PATTERNS[Number(key) - 1];
  return byIndex ?? ENTER_PATTERNS.find((p) => p.key === key) ?? DEFAULT_ENTER;
}
