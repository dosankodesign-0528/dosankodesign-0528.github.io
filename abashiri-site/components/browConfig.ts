/*
 * 人物イラスト（たまんねーっ）の眉毛ピクッ演出のパラメーター
 * /mock/brow の調整パネルからも同じ構造でいじれる。
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 * サイクルはキラキラ（.sparkle-hop）と共有していて、眉とキラキラは
 * 必ず同じ瞬間にパキッと切り替わる。
 */
export type BrowConfig = {
  /** 眉が持ち上がる量(px)。0 で止まる */
  lift: number;
  /** 1周の秒数。キラキラと共通なので変えると両方のテンポが変わる */
  cycle: number;
  /** 動かす眉。both=両方 / right=向かって右だけ / left=向かって左だけ */
  target: "both" | "left" | "right";
};

export const DEFAULT_BROW: BrowConfig = {
  lift: 5,
  cycle: 1.5,
  target: "both",
};

export function mergeBrow(partial?: Partial<BrowConfig> | null): BrowConfig {
  return partial ? { ...DEFAULT_BROW, ...partial } : DEFAULT_BROW;
}

export const BROW_STORAGE_KEY = "abashiri-brow";
