/*
 * 人物イラスト（たまんねーっ）の眉がマウスに反応する時のパラメーター
 * /mock/face の調整パネルから同じ構造でいじれる。
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 */
export type FaceConfig = {
  /** カーソルが乗った時に眉が持ち上がる量(px) */
  browLift: number;
  /** 反応する範囲をイラストの外にどれだけ広げるか(px) */
  hoverPad: number;
};

export const DEFAULT_FACE: FaceConfig = {
  browLift: 5,
  hoverPad: 0,
};

export function mergeFace(partial?: Partial<FaceConfig> | null): FaceConfig {
  return partial ? { ...DEFAULT_FACE, ...partial } : DEFAULT_FACE;
}

export const FACE_STORAGE_KEY = "abashiri-face";
