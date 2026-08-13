/*
 * 吹き出し（な〜んにもない の白いフキダシ）の共通パラメーター
 * - smooth: パスの歪みをならす平滑化処理の強さ
 * - puni:   ぷにぷに呼吸アニメ（案1）の動き
 * /mock/bubble/tune の調整パネルからも同じ構造でいじれる。
 */
export type BubbleTune = {
  smooth: {
    /** 平滑化を何回かけるか（0でオフ。多いほどツルツル） */
    passes: number;
    /** 輪郭を何点でなぞり直すか（少ないほど丸っこくなる） */
    points: number;
  };
  puni: {
    /** 横のふくらみ量(%) */
    ampX: number;
    /** 縦のふくらみ量(%) */
    ampY: number;
    /** 1回の呼吸にかける時間(秒) */
    period: number;
  };
};

export const DEFAULT_BUBBLE: BubbleTune = {
  smooth: { passes: 2, points: 72 },
  /* モーションがわかるよう大げさめの初期値 */
  puni: { ampX: 3.5, ampY: 3, period: 2.6 },
};

export function mergeBubble(partial?: Partial<BubbleTune> | null): BubbleTune {
  const d = DEFAULT_BUBBLE;
  if (!partial) return d;
  return {
    smooth: { ...d.smooth, ...partial.smooth },
    puni: { ...d.puni, ...partial.puni },
  };
}

export const BUBBLE_STORAGE_KEY = "abashiri-bubble";
