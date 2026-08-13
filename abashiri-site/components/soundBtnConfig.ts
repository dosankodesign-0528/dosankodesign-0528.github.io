/*
 * サウンドON/OFFボタン（白モック内左上）の見た目パラメーター
 * 背景は真っ白(#FFF)固定で、透過率とバックドロップブラーをいじれる。
 * /mock/shadow/tune の「サウンドボタン」セクションから調整できる。
 */
export type SoundBtnTune = {
  /** 白背景の不透明度(0〜100%) */
  opacity: number;
  /** 背景ブラー(px) */
  blur: number;
};

export const DEFAULT_SOUND_BTN: SoundBtnTune = {
  opacity: 55,
  blur: 12,
};

export function mergeSoundBtn(partial?: Partial<SoundBtnTune> | null): SoundBtnTune {
  return { ...DEFAULT_SOUND_BTN, ...partial };
}

export const SOUND_BTN_STORAGE_KEY = "abashiri-soundbtn";
/** 調整パネルからのライブ反映イベント（detail: SoundBtnTune） */
export const SOUND_BTN_TUNE_EVENT = "abashiri:soundbtn-tune";
