"use client";

/*
 * 網走の環境音（BGM）まわりのUI一式
 *
 * - 初回訪問時：「網走の環境音を楽しむことができます。再生しますか？」の ON/OFF 確認
 * - 以降はボタン1つで ON/OFF を交互に切り替え（選択はセッション中記憶）
 * - ぼーっと体験の動画再生中は環境音を自動で止め、動画が止まったら復帰
 *   （ExperienceMock が "abashiri:video-audio" イベントで知らせてくる）
 *
 * variant 1〜3 で見た目のスタイリングが変わる（/mock/sound で比較）
 */
import { useEffect, useRef, useState } from "react";

const KEY = "abashiri-bgm";
export const VIDEO_AUDIO_EVENT = "abashiri:video-audio";

export default function SoundUi({
  variant = 1,
  askConsent = false,
  alwaysAsk = false,
}: {
  /** 1〜3: UIスタイリング */
  variant?: number;
  /** true: 初回にON/OFF確認ダイアログを出す（TOPページ用） */
  askConsent?: boolean;
  /** true: 記憶を無視して毎回ダイアログを出す（mock確認用） */
  alwaysAsk?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const onRef = useRef(false);
  const duckRef = useRef(false); /* 動画再生中フラグ（動画の音声優先） */
  const [showDialog, setShowDialog] = useState(false);

  const tryPlay = () => {
    const a = audioRef.current;
    if (!a || duckRef.current) return;
    a.volume = 0.45;
    a.play().catch(() => {
      /* 自動再生がブロックされたら、次の操作で流し始める */
      const once = () => {
        if (onRef.current && !duckRef.current) a.play().catch(() => {});
        window.removeEventListener("pointerdown", once);
        window.removeEventListener("keydown", once);
      };
      window.addEventListener("pointerdown", once);
      window.addEventListener("keydown", once);
    });
  };

  const setState = (next: boolean) => {
    setOn(next);
    onRef.current = next;
    try {
      sessionStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
    if (next) tryPlay();
    else audioRef.current?.pause();
  };

  /* 初期化：記憶を読む＋必要ならダイアログ */
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(KEY);
    } catch {}
    if (askConsent && (alwaysAsk || saved === null)) setShowDialog(true);
    if (saved === "on") {
      setOn(true);
      onRef.current = true;
      tryPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 動画の音声優先：再生中は環境音を止める */
  useEffect(() => {
    const handler = (e: Event) => {
      const active = Boolean((e as CustomEvent).detail?.active);
      duckRef.current = active;
      const a = audioRef.current;
      if (!a) return;
      if (active) a.pause();
      else if (onRef.current) a.play().catch(() => {});
    };
    window.addEventListener(VIDEO_AUDIO_EVENT, handler);
    return () => window.removeEventListener(VIDEO_AUDIO_EVENT, handler);
  }, []);

  const answer = (next: boolean) => {
    setShowDialog(false);
    setState(next);
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/cape-sound.mp4" loop preload="auto" />

      {/* ===== 初回のON/OFF確認 ===== */}
      {showDialog && variant === 1 && (
        /* 案1：白カードのモーダル（ど真ん中・いちばん丁寧） */
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b3c69]/25 backdrop-blur-[3px]">
          <div className="mx-4 flex w-[400px] max-w-full flex-col items-center rounded-[28px] bg-white/95 p-8 text-center shadow-2xl">
            <p className="mb-6 text-[15px] font-bold leading-relaxed text-[#1e1e1e]">
              網走の環境音を楽しむことができます。
              <br />
              再生しますか？
            </p>
            <div className="flex w-full items-center gap-3">
              <button
                onClick={() => answer(true)}
                className="flex-1 cursor-pointer rounded-full bg-[#0070c9] py-3 text-[15px] font-black text-white transition-transform hover:scale-105"
              >
                ON
              </button>
              <button
                onClick={() => answer(false)}
                className="flex-1 cursor-pointer rounded-full border-2 border-[#bcd6ea] bg-white py-3 text-[15px] font-black text-[#7ba7cc] transition-transform hover:scale-105"
              >
                OFF
              </button>
            </div>
          </div>
        </div>
      )}
      {showDialog && variant === 2 && (
        /* 案2：下部のスリムバー（画面を遮らない控えめ案） */
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="flex max-w-full items-center gap-4 rounded-full bg-white/95 py-3 pl-5 pr-3 shadow-xl backdrop-blur">
            <span className="text-[18px]">🎧</span>
            <p className="text-[13px] font-bold leading-snug text-[#1e1e1e]">
              網走の環境音を楽しむことができます。再生しますか？
            </p>
            <button
              onClick={() => answer(true)}
              className="cursor-pointer rounded-full bg-[#0070c9] px-5 py-2 text-[13px] font-black text-white transition-transform hover:scale-105"
            >
              ON
            </button>
            <button
              onClick={() => answer(false)}
              className="cursor-pointer rounded-full bg-[#e6f3ff] px-5 py-2 text-[13px] font-black text-[#7ba7cc] transition-transform hover:scale-105"
            >
              OFF
            </button>
          </div>
        </div>
      )}
      {showDialog && variant === 3 && (
        /* 案3：左下のふきだしポップ（サイトの世界観に寄せた案） */
        <div className="fixed bottom-20 left-4 z-[60] w-[280px]">
          <div className="relative rounded-[22px] bg-white/95 p-5 shadow-xl backdrop-blur">
            <p className="mb-4 text-[13px] font-bold leading-relaxed text-[#0070c9]">
              🌊 網走の環境音を楽しむことができます。
              <br />
              再生しますか？
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => answer(true)}
                className="flex-1 cursor-pointer rounded-full bg-[#0070c9] py-2 text-[13px] font-black text-white transition-transform hover:scale-105"
              >
                ON
              </button>
              <button
                onClick={() => answer(false)}
                className="flex-1 cursor-pointer rounded-full border-2 border-[#e6f3ff] bg-white py-2 text-[13px] font-black text-[#7ba7cc] transition-transform hover:scale-105"
              >
                OFF
              </button>
            </div>
            {/* ふきだしのしっぽ */}
            <div className="absolute -bottom-2 left-7 size-4 rotate-45 bg-white/95" />
          </div>
        </div>
      )}

      {/* ===== 常設のON/OFF切り替え（1ボタンで交互） ===== */}
      {!showDialog && variant === 1 && (
        <button
          onClick={() => setState(!on)}
          aria-label={on ? "環境音をOFFにする" : "環境音をONにする"}
          className="fixed bottom-4 left-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[17px] shadow-lg backdrop-blur transition-transform hover:scale-110"
        >
          {on ? "🔊" : "🔇"}
        </button>
      )}
      {!showDialog && variant === 2 && (
        <button
          onClick={() => setState(!on)}
          aria-label={on ? "環境音をOFFにする" : "環境音をONにする"}
          className={`fixed bottom-4 left-4 z-50 flex cursor-pointer items-center gap-2 rounded-full py-2 pl-3 pr-4 text-[12px] font-black shadow-lg backdrop-blur transition-transform hover:scale-105 ${
            on ? "bg-[#0070c9] text-white" : "bg-white/90 text-[#7ba7cc]"
          }`}
        >
          <span className="text-[15px]">{on ? "🔊" : "🔇"}</span>
          環境音 {on ? "ON" : "OFF"}
        </button>
      )}
      {!showDialog && variant === 3 && (
        <button
          onClick={() => setState(!on)}
          aria-label={on ? "環境音をOFFにする" : "環境音をONにする"}
          className={`fixed bottom-4 left-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-4 shadow-lg backdrop-blur transition-all hover:scale-110 ${
            on
              ? "border-white bg-[#0070c9] text-white"
              : "border-[#e6f3ff] bg-white/90 text-[#b6cfe4]"
          }`}
        >
          <span className="text-[18px] font-black">♪</span>
        </button>
      )}
    </>
  );
}
