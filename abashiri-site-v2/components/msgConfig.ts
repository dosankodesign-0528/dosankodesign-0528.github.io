/*
 * メッセージセクション（KV直下・カンプ 15480:22896）のパラメーター
 * （2026-08-21 ヒデさん依頼）
 *
 * 作字がブラーで消える → 背景はブラーがかかったまま → そこにメッセージが登場。
 * 読み終わったら（スクロール量 len ぶん進んだら）ぼーっとスポットへ入れ替わる。
 * 出方は5案。パネルの案ピルで切り替えて、スクロールで確かめる。
 */
export type MsgTune = {
  /** 1〜5: 出方の案（MSG_PATTERNS） */
  pattern: number;
  /** 読み終わるまでのスクロール量(px)。大きいほどゆっくり読ませる */
  len: number;
  /** 作字が消えきってから、メッセージが出はじめるまでの間(px) */
  fadeIn: number;
  /** 浮かび上がり系（案2・案4）の「まだ読んでいない文字」の薄さ(%) */
  minOpacity: number;
};

export const DEFAULT_MSG: MsgTune = {
  pattern: 1,
  len: 2400,
  fadeIn: 120,
  minOpacity: 15,
};

export const MSG_PATTERNS: Record<number, { name: string; note: string }> = {
  1: {
    name: "案1",
    note: "だんだん段落。まず「網走は何もない。」が出て、スクロールで段落がひとつずつブラー出現。",
  },
  2: {
    name: "案2",
    note: "浮かび上がり。文章ぜんぶが薄く置いてあり、スクロールに合わせて読む順に濃くなっていく。",
  },
  3: {
    name: "案3",
    note: "行ごとに流れ込む。1行ずつ下からすっと上がりながらブラーが晴れる。",
  },
  4: {
    name: "案4",
    note: "なぞり読み。行の中を左から右へ、読む速さで文字が光っていく（スクロールで進む）。",
  },
  5: {
    name: "案5",
    note: "ひと場面ずつ。見出しのあと、段落が1つずつ入れ替わりで出る（スポットの場面切替と同じ呼吸）。",
  },
};

export function mergeMsg(partial?: Partial<MsgTune> | null): MsgTune {
  return { ...DEFAULT_MSG, ...partial };
}
