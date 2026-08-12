"use client";

/*
 * キービジュアルの手書きアニメーション（採用版）
 *
 * - 吹き出し＋「な〜んにもない」…… ブラーがふわっと晴れて出現
 * - 「たまらない」…… サインペンでなぞり書き（一画ずつ順に）
 * - 下の曲線のあしらい（矢印）…… 左から右へなぞって描く
 *
 * hero-message.svg を読み込んでインライン展開し、パスの位置から
 * 上段（吹き出し内）と下段（たまらない＋矢印）に分けて演出する。
 */
import { useEffect, useRef } from "react";
import { WRITE_PACES, type WritePace } from "./writePaces";

const SVG_NS = "http://www.w3.org/2000/svg";
let maskSeq = 0;

type Item = { p: SVGPathElement; x: number; midY: number; w: number; area: number };

function collect(svg: SVGSVGElement): { bubble: SVGPathElement | null; rest: Item[] } {
  const paths = Array.from(svg.querySelectorAll("path"));
  const items: Item[] = paths.map((p) => {
    const b = p.getBBox();
    return { p, x: b.x, midY: b.y + b.height / 2, w: b.width, area: b.width * b.height };
  });
  if (items.length === 0) return { bubble: null, rest: [] };
  // いちばん面積の大きいパス＝吹き出し
  const bubble = items.reduce((a, c) => (c.area > a.area ? c : a));
  const rest = items.filter((i) => i !== bubble).sort((a, b) => a.x - b.x);
  return { bubble: bubble.p, rest };
}

/* ペン先が線をなぞって書き進む（マスクのダッシュアニメ） */
function traceReveal(
  svg: SVGSVGElement,
  p: SVGPathElement,
  delay: number,
  pace: WritePace
): number {
  const len = Math.max(p.getTotalLength(), 1);
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svg.prepend(defs);
  }
  const id = `hw-mask-${maskSeq++}`;
  const mask = document.createElementNS(SVG_NS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  const c = p.cloneNode() as SVGPathElement;
  c.removeAttribute("mask");
  c.setAttribute("fill", "none");
  c.setAttribute("stroke", "#fff");
  c.setAttribute("stroke-width", "18");
  c.setAttribute("stroke-linecap", "round");
  c.setAttribute("stroke-linejoin", "round");
  c.setAttribute("stroke-dasharray", String(len));
  c.setAttribute("stroke-dashoffset", String(len));
  mask.appendChild(c);
  defs.appendChild(mask);
  p.setAttribute("mask", `url(#${id})`);

  const dur = Math.min(Math.max(len * pace.rate, pace.min), pace.max);
  c.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
    duration: dur,
    delay,
    fill: "forwards",
    easing: "linear",
  });
  return dur;
}

/* 幅の広い曲線あしらい用：左から右へペンを走らせるワイプ */
function wipeLeftToRight(p: SVGPathElement, delay: number, dur: number) {
  const hidden = "inset(-12% 112% -12% -12%)";
  const shown = "inset(-12% -12% -12% -12%)";
  p.style.clipPath = hidden;
  p.animate([{ clipPath: hidden }, { clipPath: shown }], {
    duration: dur,
    delay,
    fill: "forwards",
    easing: "cubic-bezier(0.45, 0, 0.4, 1)",
  });
}

export default function HeroWriting({
  pace = 2,
}: {
  /** 1〜3: 書くスピード（WRITE_PACES） */
  pace?: number;
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

      /* 吹き出し：ふわっと */
      if (bubble) {
        bubble.style.opacity = "0";
        bubble.animate(
          [
            { opacity: 0, filter: "blur(10px)" },
            { opacity: 1, filter: "blur(0px)" },
          ],
          { duration: 700, fill: "forwards", easing: "ease-out" }
        );
      }

      /* な〜んにもない：ブラーがゆっくり晴れて出現 */
      upper.forEach((it) => {
        it.p.style.opacity = "0";
        it.p.animate(
          [
            { opacity: 0, filter: "blur(9px)" },
            { opacity: 1, filter: "blur(0px)" },
          ],
          {
            duration: 1450,
            delay: 350,
            fill: "forwards",
            easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          }
        );
      });

      /* たまらない：左から順になぞり書き。
         幅広の曲線（矢印のあしらい）は「い」まで書き終えた最後に左→右で描く */
      const wp = WRITE_PACES[pace] ?? WRITE_PACES[2];
      const letters = lower.filter((i) => i.w <= 150);
      const flourish = lower.filter((i) => i.w > 150);
      let delay = 1550;
      letters.forEach((it) => {
        const dur = traceReveal(svg, it.p, delay, wp);
        it.p.style.opacity = "1";
        delay += dur * wp.overlap + wp.gap;
      });
      flourish.forEach((it) => {
        const dur = Math.min(Math.max(it.w * wp.rate * 2.4, wp.min * 2.2), wp.max);
        wipeLeftToRight(it.p, delay + 120, dur); /* ひと呼吸おいてから */
        delay += 120 + dur * wp.overlap + wp.gap;
      });
    })();
    return () => {
      aborted = true;
    };
  }, [pace]);

  return (
    <div ref={ref} className="h-[390px] w-[471px]" aria-label="な〜んにもない たまらない" />
  );
}
