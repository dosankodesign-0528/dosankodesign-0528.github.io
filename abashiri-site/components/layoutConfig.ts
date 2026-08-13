/*
 * ステージ内レイアウトの共通パラメーター
 * - tablet: 白モック（タブレット）の位置ずらし
 * - rail:   右側カラム（網走ロゴ・SNS・観光サイト）の位置
 * /mock/layout の調整パネルからいじれる。
 */
export type LayoutTune = {
  /** タブレットの横ずらし(px)。＋で右へ */
  tabletX: number;
  /** タブレットの縦ずらし(px)。−で上へ */
  tabletY: number;
  /** 右カラムの右端からの距離(px) */
  railX: number;
  /** 右カラムの上からの距離(px) */
  railY: number;
};

export const DEFAULT_LAYOUT: LayoutTune = {
  tabletX: 0,
  tabletY: 0,
  railX: 36,
  railY: 85,
};

export function mergeLayout(partial?: Partial<LayoutTune> | null): LayoutTune {
  return { ...DEFAULT_LAYOUT, ...partial };
}

export const LAYOUT_STORAGE_KEY = "abashiri-layout";
