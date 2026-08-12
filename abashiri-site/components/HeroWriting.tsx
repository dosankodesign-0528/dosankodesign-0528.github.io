"use client";

/*
 * キービジュアルの手書きアニメーション（採用版）
 *
 * - 吹き出し＋「な〜んにもない」…… まとめて一枚のブラーで出現
 * - 「たまらない」…… サインペンでなぞり書き。
 *   文字ごと（た→ま→ら→な→い）に、文字の中も実際のひらがなの
 *   書き順（上の画から順）でなぞる
 * - 下の曲線のあしらい …… 「い」の書き始めと同時に左から右へ
 *
 * タイミングは heroTiming.ts の共通パラメーターで調整できる。
 */
import { useEffect, useRef } from "react";
import { WRITE_PACES, type WritePace } from "./writePaces";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";

const SVG_NS = "http://www.w3.org/2000/svg";
let maskSeq = 0;

type Item = {
  p: SVGPathElement;
  x: number;
  top: number;
  midY: number;
  w: number;
  area: number;
};

function collect(svg: SVGSVGElement): { bubble: SVGPathElement | null; rest: Item[] } {
  const paths = Array.from(svg.querySelectorAll("path"));
  const items: Item[] = paths.map((p) => {
    const b = p.getBBox();
    return {
      p,
      x: b.x,
      top: b.y,
      midY: b.y + b.height / 2,
      w: b.width,
      area: b.width * b.height,
    };
  });
  if (items.length === 0) return { bubble: null, rest: [] };
  const bubble = items.reduce((a, c) => (c.area > a.area ? c : a));
  const rest = items.filter((i) => i !== bubble);
  return { bubble: bubble.p, rest };
}

/*
 * 「たまらない」5文字を、画の位置から文字ごとにグループ分けして
 * ひらがなの書き順に並べる。
 * - 文字の切れ目：中心X を並べた時の大きい隙間 上位4つ
 * - 文字の中：上にある画から（高さがほぼ同じなら左から）
 */
/** た・ま・ら・な・い の画数（このロゴの実データに合わせて固定） */
const STROKE_COUNTS = [3, 1, 2, 3, 2];

function groupIntoCharacters(letters: Item[]): Item[][] {
  const sorted = [...letters].sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2));
  const total = STROKE_COUNTS.reduce((a, b) => a + b, 0);

  let groups: Item[][] = [];
  if (sorted.length === total) {
    /* 画数が既知なので、中心Xの順に「た3画→ま1画→ら2画→な3画→い2画」と確実に割り当てる */
    let idx = 0;
    groups = STROKE_COUNTS.map((n) => {
      const g = sorted.slice(idx, idx + n);
      idx += n;
      return g;
    });
  } else {
    /* 保険：中心Xの大きい隙間で文字を区切る */
    const centers = sorted.map((i) => i.x + i.w / 2);
    const splits = centers
      .slice(1)
      .map((c, i2) => ({ at: i2 + 1, gap: c - centers[i2] }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, Math.min(4, Math.max(0, sorted.length - 1)))
      .map((g) => g.at)
      .sort((a, b) => a - b);
    let prev = 0;
    for (const s of [...splits, sorted.length]) {
      groups.push(sorted.slice(prev, s));
      prev = s;
    }
  }

  /* 文字の中は、上にある画から（高さがほぼ同じなら左から）＝ひらがなの書き順 */
  return groups.map((g) =>
    [...g].sort((a, b) => {
      if (Math.abs(a.top - b.top) > 10) return a.top - b.top;
      return a.x - b.x;
    })
  );
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
  timing = DEFAULT_HERO_TIMING,
  onScheduled,
}: {
  /** 1〜3: 書くスピード（WRITE_PACES） */
  pace?: number;
  /** タイミング設定（heroTiming.ts） */
  timing?: HeroTiming;
  /** 書き終わり予定時刻(ms)を通知（ボタン・イラスト出現の起点） */
  onScheduled?: (writingEndMs: number) => void;
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

      const kotobaStart = timing.start + timing.kotoba.delay;

      /* 吹き出し＋な〜んにもない：まとめて一枚のブラーで出現 */
      const groupPaths = [...(bubble ? [bubble] : []), ...upper.map((i) => i.p)];
      groupPaths.forEach((p) => {
        p.style.opacity = "0";
        p.animate(
          [
            { opacity: 0, filter: `blur(${timing.kotoba.blur}px)` },
            { opacity: 1, filter: "blur(0px)" },
          ],
          {
            duration: timing.kotoba.duration,
            delay: kotobaStart,
            fill: "forwards",
            easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          }
        );
      });

      /* たまらない：文字ごとに、ひらがなの書き順でなぞる */
      const wp = WRITE_PACES[pace] ?? WRITE_PACES[2];
      const letters = lower.filter((i) => i.w <= 150);
      const flourish = lower.filter((i) => i.w > 150);
      const characters = groupIntoCharacters(letters);

      let delay = kotobaStart + timing.tamaranai.delay;
      let lastCharStart = delay;
      characters.forEach((strokes, ci) => {
        if (ci === characters.length - 1) lastCharStart = delay; // 「い」の書き始め
        strokes.forEach((it) => {
          const dur = traceReveal(svg, it.p, delay, wp);
          it.p.style.opacity = "1";
          delay += dur * wp.overlap + wp.gap;
        });
      });
      const lettersEnd = delay;

      /* あしらい：「い」の書き始めと同時（offsetで微調整可）に左→右 */
      const flourishStart = lastCharStart + timing.flourish.offset;
      let flourishEnd = flourishStart;
      flourish.forEach((it) => {
        const dur = Math.min(Math.max(it.w * wp.rate * 2.4, wp.min * 2.2), wp.max);
        wipeLeftToRight(it.p, flourishStart, dur);
        flourishEnd = Math.max(flourishEnd, flourishStart + dur);
      });

      const total = Math.max(kotobaStart + timing.kotoba.duration, lettersEnd, flourishEnd);
      onScheduled?.(total);
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pace, timing]);

  return (
    <div ref={ref} className="h-[390px] w-[471px]" aria-label="な〜んにもない たまらない" />
  );
}
