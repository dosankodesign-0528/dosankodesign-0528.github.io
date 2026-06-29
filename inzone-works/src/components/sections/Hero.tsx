"use client";

import { useEffect, useState } from "react";

type Phase = "intro" | "reveal" | "done";

/**
 * トップのキービジュアル。
 * 初回読み込み時のみ Framer 風オープニングを再生：
 *   白画面にコピーがブラーから合焦 → ホールド → フェードアウトして写真をキービジュアルとして見せる。
 * 2回目以降（セッション内）や reduced-motion では写真のみ表示。
 */
export default function Hero() {
  const [phase, setPhase] = useState<Phase>("done");

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const played =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("inzone_opening_played") === "1";

    if (reduce || played) {
      setPhase("done");
      return;
    }

    // オープニング再生
    setPhase("intro");
    window.scrollTo(0, 0);
    document.documentElement.classList.add("opening-lock");

    const t1 = window.setTimeout(() => setPhase("reveal"), 2400);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      document.documentElement.classList.remove("opening-lock");
      try {
        sessionStorage.setItem("inzone_opening_played", "1");
      } catch {}
    }, 3400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.documentElement.classList.remove("opening-lock");
    };
  }, []);

  return (
    <section className="relative h-[600px] w-full overflow-hidden md:h-[860px]">
      {/* キービジュアル写真 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero.png"
        alt="inZONE のインテリア事例"
        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out"
        style={{ transform: phase === "intro" ? "scale(1.06)" : "scale(1)" }}
      />

      {/* オープニングのオーバーレイ（コピー先行表示） */}
      {phase !== "done" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-[900ms] ease-out"
          style={{ opacity: phase === "intro" ? 1 : 0 }}
        >
          <div className="px-8 text-center">
            <p
              className="intro-line font-jp text-[13px] font-light tracking-[0.08em] text-warm md:text-[15px]"
              style={{ animationDelay: "0.2s" }}
            >
              暮らしをデザインして、毎日を
            </p>
            <h1
              className="intro-line mt-4 font-serif text-[26px] font-extralight leading-[1.5] tracking-[0.04em] text-ink md:text-[44px]"
              style={{ animationDelay: "0.5s" }}
            >
              もっと楽しく、もっと上質に。
            </h1>
          </div>
        </div>
      )}
    </section>
  );
}
