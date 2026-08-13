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
import { DEFAULT_BUBBLE, type BubbleTune } from "./bubbleConfig";
import { collect } from "./writingCore";
import { waitForConsent } from "./consentGate";

/*
 * 吹き出しパスの平滑化：
 * 輪郭を等間隔の点でなぞり直し、隣どうしの平均で角を取り、
 * なめらかな曲線（Catmull-Rom→ベジェ）として描き直す。
 */
type Pt = { x: number; y: number };

/** 輪郭を等間隔の点でなぞり直す */
function samplePath(p: SVGPathElement, points: number): Pt[] | null {
  const len = p.getTotalLength();
  if (!len || points < 8) return null;
  const pts: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const pt = p.getPointAtLength((len * i) / points);
    pts.push({ x: pt.x, y: pt.y });
  }
  return pts;
}

/** 隣どうしの平均で角を取る（passes回） */
function smoothPts(src: Pt[], passes: number): Pt[] {
  let pts = src;
  for (let k = 0; k < passes; k++) {
    pts = pts.map((pt, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length];
      const b = pts[(i + 1) % pts.length];
      return { x: (a.x + pt.x * 2 + b.x) / 4, y: (a.y + pt.y * 2 + b.y) / 4 };
    });
  }
  return pts;
}

/** 点列をなめらかな閉曲線（Catmull-Rom→ベジェ）に変換 */
function ptsToPath(pts: Pt[]): string {
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} `;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + "Z";
}

function smoothBubblePath(p: SVGPathElement, passes: number, points: number) {
  if (passes <= 0) return;
  const pts = samplePath(p, points);
  if (!pts) return;
  p.setAttribute("d", ptsToPath(smoothPts(pts, passes)));
}

/* 吹き出しのムニムニアニメ（1〜3。0でなし） */
const BUBBLE_WOBBLE_FILTER = `
<filter id="bubbleWobble" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="4" result="noise">
    <animate attributeName="baseFrequency" dur="7s"
      values="0.012 0.02;0.017 0.014;0.013 0.021;0.012 0.02" repeatCount="indefinite" />
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
</filter>`;

function startBubbleAnim(
  bubble: SVGPathElement,
  svg: SVGSVGElement,
  variant: number,
  tune: BubbleTune
) {
  bubble.style.transformBox = "fill-box";
  bubble.style.transformOrigin = "50% 50%";
  if (variant === 1) {
    /* 案1: ぷにぷに呼吸（縦横を逆位相でスクイッシュ）。量と速さは bubbleConfig */
    const ax = tune.puni.ampX / 100;
    const ay = tune.puni.ampY / 100;
    bubble.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: `scale(${1 + ax}, ${1 - ay})` },
        { transform: `scale(${1 - ax * 0.6}, ${1 + ay * 0.7})` },
        { transform: "scale(1, 1)" },
      ],
      {
        duration: tune.puni.period * 1000,
        iterations: Infinity,
        easing: "ease-in-out",
      }
    );
  } else if (variant === 2) {
    /* 案2: ふわゆら漂い（浮遊＋ごくわずかな傾き） */
    bubble.animate(
      [
        { transform: "translateY(0px) rotate(0deg)" },
        { transform: "translateY(-5px) rotate(0.7deg)" },
        { transform: "translateY(1px) rotate(-0.5deg)" },
        { transform: "translateY(0px) rotate(0deg)" },
      ],
      { duration: 5200, iterations: Infinity, easing: "ease-in-out" }
    );
  } else if (variant === 4) {
    /* 案4: パス波打ち。輪郭の曲線に沿って、法線方向のゆるい波が流れていく */
    const base = samplePath(bubble, Math.max(48, tune.smooth.points));
    if (!base) return;
    const N = base.length;
    const normals = base.map((_, i) => {
      const a = base[(i - 1 + N) % N];
      const b = base[(i + 1) % N];
      const tx = b.x - a.x;
      const ty = b.y - a.y;
      const l = Math.hypot(tx, ty) || 1;
      return { x: ty / l, y: -tx / l };
    });
    let startAt: number | null = null;
    const tick = (now: number) => {
      if (!bubble.isConnected) return; /* 画面から消えたら止める */
      if (startAt === null) startAt = now;
      /* いきなり波打たず、1.2秒かけてじわっと波を立ち上げる */
      const ramp = Math.min(1, (now - startAt) / 1200);
      const t = now / 1000;
      const flow = (Math.PI * 2 * t) / tune.wave.period;
      const pts = base.map((pt, i) => {
        const th = (i / N) * tune.wave.waves * Math.PI * 2;
        /* 主の波＋細かい揺らぎを少し混ぜて機械っぽさを消す */
        const o =
          ramp *
          tune.wave.amp *
          (0.75 * Math.sin(th - flow) + 0.25 * Math.sin(th * 2 + t * 1.3 + 1.7));
        return { x: pt.x + normals[i].x * o, y: pt.y + normals[i].y * o };
      });
      bubble.setAttribute("d", ptsToPath(pts));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else if (variant === 3) {
    /* 案3: 輪郭ムニムニ（ゆらぎノイズで縁が本当に波打つ） */
    if (!svg.querySelector("#bubbleWobble")) {
      const defs =
        svg.querySelector("defs") ??
        svg.insertBefore(
          document.createElementNS("http://www.w3.org/2000/svg", "defs"),
          svg.firstChild
        );
      defs.insertAdjacentHTML("beforeend", BUBBLE_WOBBLE_FILTER);
    }
    /* 登場ブラーの fill(forwards) が filter を専有するので外してから適用 */
    bubble.getAnimations().forEach((a) => a.cancel());
    bubble.style.opacity = "1";
    bubble.style.filter = "url(#bubbleWobble)";
  }
}

export default function HeroBlurSeq({
  timing = DEFAULT_HERO_TIMING,
  gate = false,
  bubbleAnim = 0,
  bubbleTune = DEFAULT_BUBBLE,
  onScheduled,
}: {
  timing?: HeroTiming;
  /** true: 環境音のON/OFF確認が済むまで開始を待つ */
  gate?: boolean;
  /** 1〜3: 吹き出しのムニムニアニメ（0でなし） */
  bubbleAnim?: number;
  /** 吹き出しの平滑化・ぷにぷに呼吸のパラメーター（bubbleConfig.ts） */
  bubbleTune?: BubbleTune;
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
      /* 吹き出しの歪みをならす（表示前に一度だけ） */
      if (bubble) {
        smoothBubblePath(bubble, bubbleTune.smooth.passes, bubbleTune.smooth.points);
      }
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
      /* 登場が済んだらムニムニ開始 */
      if (bubble && bubbleAnim) {
        setTimeout(() => {
          if (!aborted) startBubbleAnim(bubble, svg, bubbleAnim, bubbleTune);
        }, t0 + 950);
      }
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
  }, [timing, gate, bubbleAnim, bubbleTune]);

  return (
    <div ref={ref} className="h-[390px] w-[471px]" aria-label="な〜んにもない たまらない" />
  );
}
