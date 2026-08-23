"use client";

/*
 * ぼーっとTips（動画再生ページのモーダル。カンプ 15564:22022。2026-08-23 ヒデさん依頼）
 *
 * 動画を再生して delaySec 秒たったら、画面中央にふわーっとフェードインで出る。
 * ×で閉じると fadeSec 秒かけてフェードアウト。一度閉じたらこの動画滞在中は出さない。
 * 一時停止するといったん消え、再開すると（未クローズなら）また delaySec 後に出る。
 *
 * カンプ実測値：
 *   本体 幅700 / 角丸16 / 白10% / ブラー65 / padding44 / 縦gap24 / 中央配置
 *   ピル「ぼーっとTips」 幅186 / 白40% / ブラー90 / px16 py6 / 本体上端-22px / 16px Regular
 *   見出し「五感を使おう」20px ＋「今、何が聞こえる？」46px（ExtraLight・行間1.2・gap8）
 *   本文 14px Light 行間1.8 白
 */
import { useEffect, useRef, useState } from "react";

export type BoTipsTune = {
  /** 再生からモーダルが出るまでの時間（秒） */
  delay: number;
  /** フェードイン/アウトのアニメーション時間（秒） */
  fade: number;
};
export const DEFAULT_BO_TIPS: BoTipsTune = { delay: 5, fade: 1.2 };

export default function BoTips({
  playing,
  tune = DEFAULT_BO_TIPS,
}: {
  /** 動画が再生中か（Watch の playing をそのまま渡す） */
  playing: boolean;
  tune?: BoTipsTune;
}) {
  /* hidden: 出ていない / in: 表示中 / out: フェードアウト中 */
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");
  const [closed, setClosed] = useState(false); /* ×で閉じたら滞在中は出さない */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (playing && !closed) {
      timer.current = setTimeout(
        () => setPhase("in"),
        Math.max(0, tune.delay) * 1000
      );
    } else if (!playing) {
      /* 一時停止したらフェードアウト（閉じた扱いにはしない） */
      setPhase((p) => (p === "in" ? "out" : p));
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, closed, tune.delay]);

  /* フェードアウトが終わったら DOM から下ろす */
  useEffect(() => {
    if (phase !== "out") return;
    const id = setTimeout(() => setPhase("hidden"), tune.fade * 1000);
    return () => clearTimeout(id);
  }, [phase, tune.fade]);

  const close = () => {
    setClosed(true);
    setPhase("out");
  };

  if (phase === "hidden") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      style={{
        opacity: phase === "in" ? 1 : 0,
        transition: `opacity ${tune.fade}s cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div className="pointer-events-auto relative w-[700px] max-w-[86vw] rounded-2xl bg-white/10 p-[44px] backdrop-blur-[65px]">
        {/* 上部ピル（カンプ 15564:22024。本体の上端に半分乗る） */}
        <div className="absolute -top-[22px] left-1/2 flex w-[186px] -translate-x-1/2 items-center justify-center rounded-full bg-white/40 px-4 py-[6px] backdrop-blur-[90px]">
          <p className="text-body-16 font-normal leading-[1.2] text-white">
            ぼーっとTips
          </p>
        </div>
        {/* ×（🟡仮置き：案2 右上のシンプル×。5案の比較は /mock/tips-close） */}
        <button
          type="button"
          onClick={close}
          aria-label="とじる"
          className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center text-white/70 transition-colors duration-300 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex flex-col items-center gap-6 text-center text-white">
          <div className="flex flex-col items-center gap-2 leading-[1.2]">
            {/* 見出しサイズはカンプ実測（20px/46px。トークン外のためそのまま） */}
            <p className="text-[20px] font-extralight">五感を使おう</p>
            <p className="whitespace-nowrap text-[46px] font-extralight">
              今、何が聞こえる？
            </p>
          </div>
          <p className="text-left text-body-14 font-light leading-[1.8]">
            音に集中して、耳を澄ませましょう。どんな音が聞こえてくるでしょうか。船のエンジン音、鳥のなく声、流氷が軋む音などでも構いません。その音に集中してみよう。
          </p>
        </div>
      </div>
    </div>
  );
}
