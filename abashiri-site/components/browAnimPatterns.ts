/*
 * ホバーで眉が持ち上がる時の「動き方」5案（2026-08-21 ヒデさん指示で追加）
 * 上がる量（browLift）は faceConfig で決まり、ここは動き方だけを変える。
 *
 * 2通りの作り
 *   transition … 0 → 上がった位置 へ1回で動く。イージングで性格を出す
 *   animation  … globals.css の @keyframes を使う。途中で跳ねたり漂ったりできる
 *                キーフレーム内では var(--brow-shift)（上がった位置。負のpx）を参照する
 *
 * 下ろす時はどの案も共通で、素直にすっと戻る（300ms）。
 */
export type BrowAnim = {
  key: string;
  label: string;
  note: string;
  /** 上がる時の transition（animation を使わない案） */
  ease?: string;
  duration?: number;
  /** 上がっている間に掛ける animation 一式（CSS の animation 値そのまま） */
  animation?: string;
};

export const BROW_ANIMS: BrowAnim[] = [
  {
    key: "sutto",
    label: "案1  すっ（今まで通り）",
    note: "なめらかに1回で上がる。いちばん大人しい",
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    duration: 300,
  },
  {
    key: "pyoko",
    label: "案2  ぴょこっ",
    note: "少し行き過ぎてから収まる。軽い驚き",
    ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    duration: 260,
  },
  {
    key: "hop",
    label: "案3  ぴょこぴょこ",
    note: "上がってから小さく2回はねて収まる。にぎやか",
    animation: "brow-hop 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
  },
  {
    key: "float",
    label: "案4  ふわふわ",
    note: "上がったまま、乗せている間ずっと上下にゆっくり漂う",
    animation:
      "brow-in 260ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, brow-float 1.8s 260ms ease-in-out infinite",
  },
  {
    key: "kuikkui",
    label: "案5  クイックイッ",
    note: "半分上げて一拍→もうひと上げ。2段階のタメ",
    animation: "brow-two 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
  },
];

/* 採用案。⚠️ 2026-08-21 時点ではヒデさん未決のため案1（従来と同じ動き）を仮置き */
export const DEFAULT_BROW_ANIM = 1;

export function findBrowAnim(v?: number | string | null): BrowAnim {
  if (typeof v === "string") {
    const hit = BROW_ANIMS.find((p) => p.key === v);
    if (hit) return hit;
  }
  const n = Number(v ?? DEFAULT_BROW_ANIM);
  return BROW_ANIMS[Math.min(Math.max(n, 1), BROW_ANIMS.length) - 1];
}
