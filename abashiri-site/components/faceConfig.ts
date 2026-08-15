/*
 * 人物イラスト（たまんねーっ）がマウスに反応する時のパラメーター
 * /mock/face の調整パネルからも同じ構造でいじれる。
 *
 * 単位はカンプ（1512x982 ステージ）上の px ＝ 見た目そのままの px。
 * 動きは全部「パキッと1コマ」。トランジションは掛けない。
 */
export type FaceConfig = {
  /**
   * 目の動き方
   * follow: ページのどこにカーソルがあってもその方向を見続ける
   * front:  イラストにカーソルが乗った時だけ、正面（こっち）を見る
   */
  eyeMode: "follow" | "front";
  /** カーソルが乗った時に眉が持ち上がる量(px) */
  browLift: number;
  /** follow: 黒目が左右に動ける量(px)。画面の端で最大になる */
  eyeRangeX: number;
  /** follow: 黒目が上下に動ける量(px) */
  eyeRangeY: number;
  /** front: 正面を見た時の黒目の位置(px)。右が＋ */
  eyeFrontX: number;
  /** front: 同じく上下(px)。下が＋ */
  eyeFrontY: number;
  /** 反応する範囲をイラストの外にどれだけ広げるか(px) */
  hoverPad: number;
};

export const DEFAULT_FACE: FaceConfig = {
  eyeMode: "follow",
  browLift: 5,
  /* 黒目は白目の形で切り抜いてあるので、はみ出す心配はしなくてよい。
     この数値は「動きすぎて白目だけになる」のを防ぐための見た目の調整 */
  eyeRangeX: 3.5,
  eyeRangeY: 1.5,
  /* 正面を見る位置は、カンプから取れる値ではないので暫定。
     /mock/face で見ながら決める */
  eyeFrontX: 3,
  eyeFrontY: 0,
  hoverPad: 0,
};

export function mergeFace(partial?: Partial<FaceConfig> | null): FaceConfig {
  return partial ? { ...DEFAULT_FACE, ...partial } : DEFAULT_FACE;
}

export const FACE_STORAGE_KEY = "abashiri-face";
