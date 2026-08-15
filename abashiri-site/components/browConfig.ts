/*
 * 人物イラスト（たまんねーっ）の眉毛がホバーで動く量
 * /mock/brow の調整パネルからも同じ構造でいじれる。
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 * 動きは「パキッと1コマ」。トランジションは掛けない。
 */
export type BrowConfig = {
  /** カーソルが乗った時に眉が持ち上がる量(px)。0 で動かない */
  lift: number;
  /** 反応する範囲をイラストの外にどれだけ広げるか(px) */
  hoverPad: number;
};

export const DEFAULT_BROW: BrowConfig = {
  lift: 5,
  hoverPad: 0,
};

export function mergeBrow(partial?: Partial<BrowConfig> | null): BrowConfig {
  return partial ? { ...DEFAULT_BROW, ...partial } : DEFAULT_BROW;
}

export const BROW_STORAGE_KEY = "abashiri-brow";
