"use client";

/*
 * キービジュアルの手書き文字を「サインペンで書いている」ように見せる
 * パスアニメーション。hero-message.svg を読み込んでインライン展開し、
 * 各パスを書き順（吹き出し → 上段左→右 → 下段左→右）に並べて順番に描く。
 *
 * variant:
 *  1: なぞり書き …… ペン先が線をなぞって書き進む（マスクのダッシュアニメ）
 *  2: 筆順ワイプ …… 画ごとに左からサッと書き上がる
 *  3: インクがにじむ …… 画ごとにじわっとインクが染みるように現れる
 */
import { useEffect, useRef } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";
let maskSeq = 0;

type Item = { p: SVGPathElement; x: number; midY: number; area: number };

function collectSorted(svg: SVGSVGElement): { bubble: SVGPathElement | null; rest: Item[] } {
  const paths = Array.from(svg.querySelectorAll("path"));
  const items: Item[] = paths.map((p) => {
    const b = p.getBBox();
    return { p, x: b.x, midY: b.y + b.height / 2, area: b.width * b.height };
  });
  if (items.length === 0) return { bubble: null, rest: [] };
  // いちばん面積の大きいパス＝吹き出し
  const bubble = items.reduce((a, c) => (c.area > a.area ? c : a));
  const rest = items
    .filter((i) => i !== bubble)
    .sort((a, b) => {
      const rowA = a.midY < 205 ? 0 : 1;
      const rowB = b.midY < 205 ? 0 : 1;
      if (rowA !== rowB) return rowA - rowB;
      return a.x - b.x;
    });
  return { bubble: bubble.p, rest };
}

/* 案1：パスをなぞるマスクで、ペンが走るように描く */
function traceReveal(svg: SVGSVGElement, p: SVGPathElement, delay: number): number {
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

  const dur = Math.min(Math.max(len * 0.6, 120), 700);
  c.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { duration: dur, delay, fill: "forwards", easing: "linear" }
  );
  return dur;
}

/* 案2：画ごとに左からワイプして書き上がる */
function wipeReveal(p: SVGPathElement, delay: number) {
  const hidden = "inset(-8% 108% -8% -8%)";
  const shown = "inset(-8% -8% -8% -8%)";
  p.style.clipPath = hidden;
  p.animate([{ clipPath: hidden }, { clipPath: shown }], {
    duration: 240,
    delay,
    fill: "forwards",
    easing: "ease-out",
  });
}

/* 案3：画ごとにインクがじわっと染みる */
function inkReveal(p: SVGPathElement, delay: number) {
  p.style.opacity = "0";
  p.style.transformBox = "fill-box";
  p.style.transformOrigin = "center";
  p.animate(
    [
      { opacity: 0, filter: "blur(5px)", transform: "scale(0.88)" },
      { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
    ],
    { duration: 480, delay, fill: "forwards", easing: "ease-out" }
  );
}

export default function HeroWriting({ variant }: { variant: number }) {
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

      const { bubble, rest } = collectSorted(svg);

      /* 吹き出しは最初にふわっと */
      if (bubble) {
        bubble.style.opacity = "0";
        bubble.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 550,
          fill: "forwards",
          easing: "ease-out",
        });
      }

      let delay = 450;
      rest.forEach((it, i) => {
        if (variant === 1) {
          const dur = traceReveal(svg, it.p, delay);
          it.p.style.opacity = "1";
          delay += dur * 0.8; // 少し重ねて流れるように
        } else if (variant === 2) {
          wipeReveal(it.p, 450 + i * 85);
        } else {
          inkReveal(it.p, 450 + i * 95);
        }
      });
    })();
    return () => {
      aborted = true;
    };
  }, [variant]);

  return <div ref={ref} className="h-[390px] w-[471px]" aria-label="な〜んにもない たまらない" />;
}
