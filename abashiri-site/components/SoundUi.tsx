"use client";

/*
 * 網走の環境音（BGM）まわりのUI一式（案1採用版）
 *
 * - 初回訪問時：「網走の環境音を楽しむことができます。再生しますか？」の ON/OFF 確認
 * - 以降はスピーカーのピクトグラム1つで ON/OFF を交互切替（OFFは斜線つき）
 * - ボタンの表示は「実際に音が鳴っているか」と常に同期
 *   （ONにしたら鳴る／OFFにしたら止まる、が直感どおりになる）
 * - ぼーっと体験の動画再生中は環境音を自動で止め、動画が止まったら復帰
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { markConsentDone } from "./consentGate";
import { devSilent } from "./devSound";

/** 白モック内のボタン置き場（TopPage / ExperienceFlow が用意する） */
const SLOT_ID = "abashiri-sound-slot";

import {
  DEFAULT_SOUND_BTN,
  SOUND_BTN_STORAGE_KEY,
  SOUND_BTN_TUNE_EVENT,
  mergeSoundBtn,
  type SoundBtnTune,
} from "./soundBtnConfig";

const KEY = "abashiri-bgm";
export const VIDEO_AUDIO_EVENT = "abashiri:video-audio";

/* スピーカーのピクトグラム。OFFの時は斜線が入る */
function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[20px] w-[20px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4 9.3v5.4h3.4L12.2 19V5L7.4 9.3H4Z"
        fill="currentColor"
        strokeWidth="1.4"
      />
      {on && (
        <>
          <path d="M15.3 9.4a3.7 3.7 0 0 1 0 5.2" />
          <path d="M17.8 7a7.1 7.1 0 0 1 0 10" />
        </>
      )}
      {!on && <line x1="3" y1="3.4" x2="21" y2="20.6" />}
    </svg>
  );
}

export default function SoundUi({
  askConsent = false,
  alwaysAsk = false,
}: {
  /** true: 初回にON/OFF確認ダイアログを出す（TOPページ用） */
  askConsent?: boolean;
  /** true: 記憶を無視して毎回ダイアログを出す（確認用） */
  alwaysAsk?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** ユーザーの意思（ONにしたい/したくない）。セッション中記憶 */
  const intentRef = useRef(false);
  /** 実際に音が鳴っているか（ボタン表示はこれに追従） */
  const [audible, setAudible] = useState(false);
  const duckRef = useRef(false); /* 動画再生中フラグ（動画の音声優先） */
  const [showDialog, setShowDialog] = useState(false);

  /* ボタンの見た目（白の濃さ・背景ブラー）。調整パネルからライブで変えられる */
  const [btnTune, setBtnTune] = useState<SoundBtnTune>(DEFAULT_SOUND_BTN);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SOUND_BTN_STORAGE_KEY);
      if (raw) setBtnTune(mergeSoundBtn(JSON.parse(raw)));
    } catch {}
    const onTune = (e: Event) =>
      setBtnTune(mergeSoundBtn((e as CustomEvent).detail));
    window.addEventListener(SOUND_BTN_TUNE_EVENT, onTune);
    return () => window.removeEventListener(SOUND_BTN_TUNE_EVENT, onTune);
  }, []);

  /* ボタンはモック内左上の置き場に出す。無いページでは画面左下に出す */
  const pathname = usePathname();
  const [slot, setSlot] = useState<Element | null>(null);
  useEffect(() => {
    const find = () => setSlot(document.getElementById(SLOT_ID));
    find();
    /* ページ遷移直後は置き場がまだ無いことがあるので現れるまで監視 */
    const obs = new MutationObserver(find);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [pathname]);

  const play = () => {
    const a = audioRef.current;
    if (!a || duckRef.current) return;
    if (devSilent()) return; /* 開発中(localhost)は鳴らさない。?sound で解除 */
    a.volume = 0.45;
    a.muted = false;
    a.play().catch(() => {});
  };

  const saveIntent = (next: boolean) => {
    intentRef.current = next;
    try {
      sessionStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
  };

  /* 表示状態は audio の実際の再生状態に常に同期 */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const upd = () => setAudible(!a.paused);
    a.addEventListener("play", upd);
    a.addEventListener("pause", upd);
    a.addEventListener("ended", upd);
    return () => {
      a.removeEventListener("play", upd);
      a.removeEventListener("pause", upd);
      a.removeEventListener("ended", upd);
    };
  }, []);

  /* 初期化：記憶を読む＋必要ならダイアログ。
     ON記憶で自動再生がブロックされたら、最初の操作でそっと再開 */
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(KEY);
    } catch {}
    if (askConsent && (alwaysAsk || saved === null)) {
      setShowDialog(true);
    } else {
      /* ダイアログを出さない時は、すぐアニメーション開始してよい */
      markConsentDone();
    }
    if (saved === "on") {
      intentRef.current = true;
      play();
      const resume = () => {
        if (intentRef.current && !duckRef.current && audioRef.current?.paused) play();
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
      window.addEventListener("pointerdown", resume);
      window.addEventListener("keydown", resume);
      return () => {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
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
      else if (intentRef.current) play();
    };
    window.addEventListener(VIDEO_AUDIO_EVENT, handler);
    return () => window.removeEventListener(VIDEO_AUDIO_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (next: boolean) => {
    setShowDialog(false);
    saveIntent(next);
    if (next) play();
    else audioRef.current?.pause();
    /* ON/OFFを選んだらアニメーション開始の合図を出す */
    markConsentDone();
  };

  /* ボタンは「今鳴っているか」で切り替える：
     無音なら押すと鳴る／鳴っていれば押すと止まる */
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      saveIntent(true);
      play();
    } else {
      saveIntent(false);
      a.pause();
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/cape-sound.mp4" loop preload="auto" />

      {/* 初回のON/OFF確認（白カードのモーダル） */}
      {showDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-shadow/30 backdrop-blur-veil">
          <div className="mx-4 flex w-[400px] max-w-full flex-col items-center rounded-panel bg-white/90 p-8 text-center shadow-modal">
            <p className="mb-6 text-body font-bold leading-[1.6] text-ink">
              網走の環境音を楽しむことができます。
              <br />
              再生しますか？
            </p>
            <div className="flex w-full items-center gap-3">
              <button
                onClick={() => answer(true)}
                className="flex-1 cursor-pointer rounded-full bg-brand py-3 text-body font-black text-white transition-transform hover:scale-105"
              >
                ON
              </button>
              <button
                onClick={() => answer(false)}
                className="flex-1 cursor-pointer rounded-full bg-canvas py-3 text-body font-black text-ink-muted transition-transform hover:scale-105"
              >
                OFF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 常設のON/OFF切り替え（スピーカーのピクトグラム）
          白モック内の置き場があればそこ（左上）、無いページでは画面左下 */}
      {!showDialog &&
        (() => {
          const btn = (
            <button
              onClick={toggle}
              aria-label={audible ? "環境音をOFFにする" : "環境音をONにする"}
              style={{
                backgroundColor: `rgba(255,255,255,${btnTune.opacity / 100})`,
                backdropFilter: `blur(${btnTune.blur}px)`,
                WebkitBackdropFilter: `blur(${btnTune.blur}px)`,
              }}
              className={`${
                slot ? "" : "fixed bottom-4 left-4 z-50 "
              }flex h-11 w-11 cursor-pointer items-center justify-center rounded-full shadow-floating transition-transform hover:scale-110 ${
                audible ? "text-brand" : "text-ink-muted"
              }`}
            >
              <SpeakerIcon on={audible} />
            </button>
          );
          return slot ? createPortal(btn, slot) : btn;
        })()}
    </>
  );
}
