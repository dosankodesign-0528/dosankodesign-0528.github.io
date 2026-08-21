/*
 * 人物イラスト（たまんねーっ）の眉がマウスに反応する時のパラメーター
 * /mock/brow の調整パネルから触れる。
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 */
export type FaceConfig = {
  /** カーソルが乗った時に眉が持ち上がる量(px) */
  browLift: number;
  /** 眉そのものの置き場所を横にずらす(px)。＋で右 */
  browX: number;
  /** 眉そのものの置き場所を縦にずらす(px)。＋で下 */
  browY: number;
  /** 反応する範囲をイラストの外にどれだけ広げるか(px) */
  hoverPad: number;
};

/* ヒデさん調整値。
   持ち上げ量は 12px だと上がりすぎとの指摘があり 6px に下げた（2026-08-20）。
   右下の調整パネルでその場で変えられる。 */
export const DEFAULT_FACE: FaceConfig = {
  browLift: 6,
  browX: 0,
  browY: 0,
  hoverPad: 0,
};

export function mergeFace(partial?: Partial<FaceConfig> | null): FaceConfig {
  return partial ? { ...DEFAULT_FACE, ...partial } : DEFAULT_FACE;
}

export const FACE_STORAGE_KEY = "abashiri-face";
