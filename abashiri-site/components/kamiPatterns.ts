/* 紙芝居パターン（吹き出し→な→伸ばし棒ビヨーン→収まる→んにもない→たまらない）の
   バリエーション定義 */
export type KamiPattern = {
  name: string;
  desc: string;
  /** 伸ばし棒が伸びる時間(ms) */
  growDur: number;
  /** 伸びの緩急（CSSイージング） */
  growEase: [number, number, number, number];
  /** 伸び切ってから縮み始めるまでのタメ(ms) */
  hold: number;
  /** 縮むバネの硬さ・弾み（damping小=よく弾む） */
  stiffness: number;
  damping: number;
  /** んにもない の出方 */
  letterStyle: "pop" | "fade" | "drop";
  /** んにもない の1文字ごとの間(ms) */
  letterStagger: number;
};

export const KAMI_PATTERNS: Record<number, KamiPattern> = {
  1: {
    name: "ぽよんと弾む",
    desc: "伸ばし棒が勢いよくビヨーンと伸びて、ぽよんぽよんと弾みながら「〜」に収まる。いちばん愛嬌のある案。",
    growDur: 500,
    growEase: [0.34, 1.3, 0.64, 1],
    hold: 130,
    stiffness: 260,
    damping: 11,
    letterStyle: "pop",
    letterStagger: 90,
  },
  2: {
    name: "するりと上品",
    desc: "スーッと静かに伸びて、ほとんど弾まずにすんなり「〜」へ。んにもない はふわっとフェード。大人しい案。",
    growDur: 850,
    growEase: [0.22, 1, 0.36, 1],
    hold: 60,
    stiffness: 170,
    damping: 22,
    letterStyle: "fade",
    letterStagger: 110,
  },
  3: {
    name: "タメて一気に",
    desc: "じわ〜っとタメてから一気にビョンッと戻る、緩急強めの案。んにもない は上からストンと落ちてくる。",
    growDur: 1100,
    growEase: [0.65, 0.05, 0.85, 0.3],
    hold: 280,
    stiffness: 330,
    damping: 9,
    letterStyle: "drop",
    letterStagger: 70,
  },
};
