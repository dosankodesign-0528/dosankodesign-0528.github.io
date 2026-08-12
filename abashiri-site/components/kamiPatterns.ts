/* 紙芝居パターン（吹き出し→な→伸ばし棒ビヨーン→収まる→んにもない→たまらない）の
   バリエーション定義
   - 伸ばし棒は最初から最後まで「〜」の曲線のまま伸縮（直線にしない・太さ一定）
   - バウンスするのは伸ばし棒だけ。文字はふわっとフェードのみ */
export type KamiPattern = {
  name: string;
  desc: string;
  /** 伸ばし棒が伸びる時間(ms) */
  growDur: number;
  /** 伸びの緩急（CSSイージング） */
  growEase: [number, number, number, number];
  /** 伸び切ってから縮み始めるまでのタメ(ms) */
  hold: number;
  /** 縮み方：バネ（弾む）かトゥイーン（弾まない） */
  settle:
    | { type: "spring"; stiffness: number; damping: number }
    | { type: "tween"; dur: number; ease: [number, number, number, number] };
  /** んにもない の1文字ごとの間(ms) と フェード時間(ms) */
  letterStagger: number;
  letterDur: number;
};

export const KAMI_PATTERNS: Record<number, KamiPattern> = {
  1: {
    name: "ぽよんと弾む",
    desc: "曲線のままビヨーンと伸びて、ぽよんと弾みながら「〜」に戻る。弾むのは伸ばし棒だけで、文字はふわっと。",
    growDur: 480,
    growEase: [0.3, 1.15, 0.5, 1],
    hold: 130,
    settle: { type: "spring", stiffness: 250, damping: 11 },
    letterStagger: 90,
    letterDur: 400,
  },
  2: {
    name: "するりと上品",
    desc: "スーッと伸びて、弾まずにするりと「〜」へ戻る。全体がいちばん静かな案。",
    growDur: 850,
    growEase: [0.22, 1, 0.36, 1],
    hold: 80,
    settle: { type: "tween", dur: 650, ease: [0.22, 1, 0.36, 1] },
    letterStagger: 110,
    letterDur: 480,
  },
  3: {
    name: "タメて一気に",
    desc: "じわ〜っとタメて限界まで伸びてから、ビョンッと勢いよく戻る。緩急がいちばん強い案。",
    growDur: 1150,
    growEase: [0.6, 0.05, 0.8, 0.4],
    hold: 280,
    settle: { type: "spring", stiffness: 340, damping: 10 },
    letterStagger: 70,
    letterDur: 340,
  },
};
