"use client";

/*
 * トップページのBGM（岬の環境音）
 * - ページを開いたら再生を試みる。ブラウザにブロックされたら、
 *   最初のクリック/スクロール/キー操作で自動的に流し始める
 * - 左下の小さなボタンでいつでもオン/オフできる
 */
import { useEffect, useRef, useState } from "react";

export default function Bgm() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.45;
    let armed = true;
    const cleanup = () => {
      if (!armed) return;
      armed = false;
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("wheel", tryPlay);
    };
    const tryPlay = () => {
      a.play()
        .then(() => {
          setPlaying(true);
          cleanup();
        })
        .catch(() => {});
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    window.addEventListener("wheel", tryPlay);
    return () => {
      cleanup();
      a.pause();
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/cape-sound.mp4" loop preload="auto" />
      <button
        onClick={toggle}
        aria-label={playing ? "BGMを止める" : "BGMを流す"}
        className="fixed bottom-4 left-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[17px] shadow-lg backdrop-blur transition-transform hover:scale-110"
      >
        {playing ? "🔊" : "🔇"}
      </button>
    </>
  );
}
