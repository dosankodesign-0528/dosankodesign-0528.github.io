/*
 * 「この場所にする」を押してから動画の世界に入るまでの遷移演出 5案。
 * /mock/enter で並べて比べられる。
 *
 * 共通の考え方
 * - 選んだカードが「窓枠」。その窓に近づいて、くぐって、向こう側の世界に出る
 * - 窓枠（白フチ10px・角丸120px）は近づくにつれて外れ、最後は全画面になる
 * - 人物イラストは右下に現れて、一緒に入っていく
 * - 秒数の正確さより、のんびりした空気を優先する（v1.0 のモーション方針を踏襲）
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 */
export type EnterPattern = {
  key: string;
  label: string;
  note: string;
  /** 全体の尺(ms)。この時間が終わったら動画画面に切り替わる */
  duration: number;
  /** framer-motion 用の cubic-bezier 4値 */
  ease: [number, number, number, number];
  /** カードの拡大。1 = 等倍、~2.4 で画面いっぱいを超える */
  scale: [number, number];
  /** 角丸(px)。窓枠が外れていく */
  radius: [number, number];
  /** 白フチ(px) */
  border: [number, number];
  /** 画面全体のブラー(px)。途中で深くしてから晴らす案もある */
  blur: [number, number, number];
  /** 周囲を暗く落とす量(0-1)。トンネル感を出す */
  dim: number;
  /** 人物イラストが右下に出てくるまで(ms) */
  illustDelay: number;
};

const STANDARD: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SLOW_IN: [number, number, number, number] = [0.5, 0, 0.2, 1];
const LINEAR_ISH: [number, number, number, number] = [0.4, 0.1, 0.6, 0.9];

export const ENTER_PATTERNS: EnterPattern[] = [
  {
    key: "straight",
    label: "案1  まっすぐ入る",
    note: "窓に正面から寄って、角丸とフチが外れて全画面になる。いちばん素直",
    duration: 1400,
    ease: STANDARD,
    scale: [1, 2.4],
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0,
    illustDelay: 120,
  },
  {
    key: "tunnel",
    label: "案2  吸い込まれる",
    note: "まわりが暗く落ちながら窓へ寄る。トンネルをくぐる感じが強い",
    duration: 1600,
    ease: SLOW_IN,
    scale: [1, 2.8],
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0.55,
    illustDelay: 100,
  },
  {
    key: "window",
    label: "案3  窓が開いてから入る",
    note: "先に窓枠だけスッと消えて、それから世界が広がる。ワンテンポ置く",
    duration: 1700,
    ease: STANDARD,
    scale: [1, 2.4],
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 0, 0],
    dim: 0.2,
    illustDelay: 320,
  },
  {
    key: "focus",
    label: "案4  ピントが合う",
    note: "一度ぼやけてから晴れる。目が慣れていくような、いちばんのんびりした入り方",
    duration: 1800,
    ease: STANDARD,
    scale: [1, 2.3],
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 18, 0],
    dim: 0.15,
    illustDelay: 160,
  },
  {
    key: "drift",
    label: "案5  ゆっくり流れ込む",
    note: "等速に近い長い尺。急がされない、いちばん引きの強い入り方",
    duration: 2400,
    ease: LINEAR_ISH,
    scale: [1, 2.6],
    radius: [120, 0],
    border: [10, 0],
    blur: [0, 6, 0],
    dim: 0.3,
    illustDelay: 200,
  },
];

export const DEFAULT_ENTER = ENTER_PATTERNS[0];

export function findEnter(key?: string | number | null): EnterPattern {
  if (key == null) return DEFAULT_ENTER;
  const byIndex = ENTER_PATTERNS[Number(key) - 1];
  return byIndex ?? ENTER_PATTERNS.find((p) => p.key === key) ?? DEFAULT_ENTER;
}
