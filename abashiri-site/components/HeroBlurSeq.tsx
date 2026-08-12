"use client";

/*
 * キービジュアル 決定版（なぞり書きなしのブラー順出し）
 *
 * 1. 白い吹き出しがブラーで出現
 * 2. 「な〜んにもない」の文字がブラーで出現
 * 3. 「たまらない」（下の曲線あしらい込み）がブラーで出現
 * 4. （TopMock経由で）「ぼーっとしてみる」ボタン → 最後にイラスト
 *
 * タイミングは heroTiming.ts の共通パラメーターに追従する。
 */
import { useEffect, useRef } from "react";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";
import { collect } from "./writingCore";
import { waitForConsent } from "./consentGate";

export default function HeroBlurSeq({
  timing = DEFAULT_HERO_TIMING,
  gate = false,
  onScheduled,
}: {
  timing?: HeroTiming;
  /** true: 環境音のON/OFF確認が済むまで開始を待つ */
  gate?: boolean;
  /** 全体の完了予定時刻(ms)を通知（ボタン・イラスト出現の起点） */
  onScheduled?: (endMs: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      const res = await fetch("/img/hero-message.svg");
      const text = await res.text();
      if (aborted || !ref.current) return;
      ref.current.innerHTML = text;
      const svg = ref.current.querySelector("svg");
      if (!svg) return;
      svg.setAttribute("width", "471");
      svg.setAttribute("height", "390");

      const { bubble, rest } = collect(svg);
      const upper = rest.filter((i) => i.midY < 205); // な〜んにもない
      const lower = rest.filter((i) => i.midY >= 205); // たまらない＋あしらい

      /* 先に全部隠しておき、ON/OFFの選択が済んでから始める */
      [...(bubble ? [bubble] : []), ...rest.map((i) => i.p)].forEach(
        (p) => (p.style.opacity = "0")
      );
      if (gate) await waitForConsent();
      if (aborted) return;

      const blurIn = (
        paths: SVGPathElement[],
        delay: number,
        dur: number,
        blur: number
      ) => {
        paths.forEach((p) => {
          p.style.opacity = "0";
          p.animate(
            [
              { opacity: 0, filter: `blur(${blur}px)` },
              { opacity: 1, filter: "blur(0px)" },
            ],
            {
              duration: dur,
              delay,
              fill: "forwards",
              easing: "cubic-bezier(0.33, 1, 0.68, 1)",
            }
          );
        });
      };

      /* 1. 吹き出し */
      const t0 = timing.start;
      blurIn(bubble ? [bubble] : [], t0, 900, 16);
      /* 2. な〜んにもない */
      const t1 = t0 + 650;
      blurIn(
        upper.map((i) => i.p),
        t1,
        timing.kotoba.duration,
        timing.kotoba.blur
      );
      /* 3. たまらない（あしらい込み） */
      const t2 = t1 + Math.max(400, timing.kotoba.duration * 0.55);
      blurIn(
        lower.map((i) => i.p),
        t2,
        1100,
        timing.kotoba.blur
      );

      onScheduled?.(t2 + 850);
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing, gate]);

  return (
    <div ref={ref} className="h-[390px] w-[471px]" aria-label="な〜んにもない たまらない" />
  );
}
