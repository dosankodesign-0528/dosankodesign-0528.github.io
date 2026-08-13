"use client";

/*
 * キービジュアル 決定版（なぞり書きなしのブラー順出し）
 *
 * 1. 白い吹き出しが「しっぽなし」の丸い形でブラー出現
 * 2. 「な〜んにもない」の文字がブラーで出現
 *    （同時に、吹き出しのしっぽが下へじわーっと伸びはじめる）
 * 3. しっぽが伸びきってぷるんと落ち着くのに合わせて
 *    「たまらない」（下の曲線あしらい込み）がブラーで出現
 *    ＝吹き出しが「たまらない」としゃべったように見える
 * 4. （TopMock経由で）「ぼーっとしてみる」ボタン → 最後にイラスト
 *
 * タイミングは heroTiming.ts の共通パラメーターに追従する。
 * しっぽの伸びは bubbleConfig.ts の tail で調整する。
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

/**
 * 隣どうしの平均で角を取る（passes回）。
 * strengthAt を渡すと、点ごとに補正の効き具合を 0〜1 で変えられる。
 * （0＝その点は元のまま＝角が残る、1＝しっかりならす）
 * しっぽの先だけ角丸を弱めたいので使う。
 */
function smoothPts(
  src: Pt[],
  passes: number,
  strengthAt?: (i: number) => number
): Pt[] {
  let pts = src;
  for (let k = 0; k < passes; k++) {
    pts = pts.map((pt, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length];
      const b = pts[(i + 1) % pts.length];
      const sx = (a.x + pt.x * 2 + b.x) / 4;
      const sy = (a.y + pt.y * 2 + b.y) / 4;
      const w = strengthAt ? strengthAt(i) : 1;
      if (w >= 1) return { x: sx, y: sy };
      return { x: pt.x + (sx - pt.x) * w, y: pt.y + (sy - pt.y) * w };
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

/**
 * しっぽの範囲の中で、補正をどれだけ弱めるかの重み。
 * 先端でいちばん弱く、付け根に向かってなだらかに元の強さへ戻す。
 * （いきなり切り替えると付け根に折れ目が出るため）
 */
function tailSoftenAt(k: number, len: number): number {
  const t = (k + 0.5) / len;
  return Math.min(1, Math.min(t, 1 - t) / 0.25);
}

/* ───────── しっぽ（吹き出しの下のとんがり）を伸ばす演出 ─────────
 * 輪郭を点でなぞって、いちばん下へ飛び出している部分＝しっぽを見つけ、
 * そこを「なだらかな底」に置き換えた〈引っ込めた形〉を作っておく。
 * 登場後にその形から本来の形へ点を補間していくと、
 * しっぽがにゅーっと下へ伸びて、しゃべり出したように見える。
 */

/** Catmull-Rom（4点を通るなめらかな曲線）上の点を取る */
function crPoint(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const t2 = t * t;
  const t3 = t2 * t;
  const axis = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return {
    x: axis(p0.x, p1.x, p2.x, p3.x),
    y: axis(p0.y, p1.y, p2.y, p3.y),
  };
}

/**
 * 輪郭の点列から、下に飛び出したしっぽの範囲を探す。
 * いちばん下の点から左右へ「下り坂が続くかぎり」広げ、
 * 谷の両肩（＝これ以上下がらなくなる点）の内側をしっぽとみなす。
 */
function findTailRange(pts: Pt[]): { i0: number; len: number } | null {
  const N = pts.length;
  if (N < 16) return null;
  const at = (i: number) => (i + N * 2) % N;
  let apex = 0;
  for (let i = 1; i < N; i++) if (pts[i].y > pts[apex].y) apex = i;

  let lo = apex;
  for (let k = 0; k < N; k++) {
    if (pts[at(lo - 1)].y >= pts[lo].y) break;
    lo = at(lo - 1);
  }
  let hi = apex;
  for (let k = 0; k < N; k++) {
    if (pts[at(hi + 1)].y >= pts[hi].y) break;
    hi = at(hi + 1);
  }
  /* 両肩そのものは動かさない（付け根をなめらかに保つ） */
  const i0 = at(lo + 1);
  const len = at(hi - 1 - i0) + 1;
  /* 谷が浅すぎる／広すぎるときは「しっぽ」ではないので何もしない */
  const depth = pts[apex].y - Math.max(pts[at(i0 - 1)].y, pts[at(i0 + len)].y);
  if (len < 2 || len > N * 0.35 || depth < 4) return null;
  return { i0, len };
}

type TailPlan = {
  /** 本来の輪郭（伸びきった状態） */
  full: Pt[];
  /** しっぽを引っ込めた輪郭（しっぽの範囲だけ差し替え） */
  retracted: (Pt | undefined)[];
};

/**
 * 吹き出しの下ごしらえ（表示前に一度だけ）。
 *
 * 1. 輪郭を等間隔の点でなぞる
 * 2. その素の点列からしっぽの範囲を見つける
 *    （ならしたあとだと、しっぽが浅くなっていて見つけにくい）
 * 3. 歪みをならす。ただし tail.sharp のぶんだけ、しっぽの先は効きを弱める
 *    → 胴体はツルッとしたまま、しっぽの先の丸まりすぎだけ戻る
 * 4. 「しっぽを引っ込めた形」も作っておく（伸ばす演出の開始形）
 *
 * 点列は使い回す。ここで作った形をもう一度なぞり直すと、
 * せっかく残したしっぽの先がまた削れてしまうため。
 */
function prepareBubble(bubble: SVGPathElement, tune: BubbleTune): TailPlan | null {
  const raw = samplePath(bubble, Math.max(48, tune.smooth.points));
  if (!raw) return null;
  const N = raw.length;
  const at = (i: number) => (i + N * 2) % N;
  const range = findTailRange(raw);

  /* しっぽの先だけ、ならしの効きを (1 - sharp) 倍に落とす */
  const sharp = Math.min(1, Math.max(0, tune.tail.sharp / 100));
  const strengthAt =
    range && sharp > 0
      ? (i: number) => {
          const k = at(i - range.i0);
          if (k >= range.len) return 1; /* しっぽの外は今までどおり */
          return 1 - sharp * tailSoftenAt(k, range.len);
        }
      : undefined;
  const full = smoothPts(raw, tune.smooth.passes, strengthAt);
  bubble.setAttribute("d", ptsToPath(full));

  if (!range) return null;
  /* しっぽの外側2点ずつを使って、しっぽがなかった場合の底を引き直す */
  const a2 = full[at(range.i0 - 2)];
  const a1 = full[at(range.i0 - 1)];
  const b1 = full[at(range.i0 + range.len)];
  const b2 = full[at(range.i0 + range.len + 1)];
  const retracted: (Pt | undefined)[] = new Array(N);
  for (let k = 0; k < range.len; k++) {
    retracted[at(range.i0 + k)] = crPoint(a2, a1, b1, b2, (k + 1) / (range.len + 1));
  }
  return { full, retracted };
}

/** 伸び具合 p（0=引っ込み, 1=本来の形, 1超で行き過ぎ）を反映する */
function drawTail(bubble: SVGPathElement, plan: TailPlan, p: number) {
  const pts = plan.full.map((pt, i) => {
    const r = plan.retracted[i];
    if (!r) return pt;
    return { x: r.x + (pt.x - r.x) * p, y: r.y + (pt.y - r.y) * p };
  });
  bubble.setAttribute("d", ptsToPath(pts));
}

/**
 * 伸びのカーブ：
 * じわーっと伸びて（ease-in-out）、行き過ぎたところから
 * ぷるんと本来の長さへ戻る。返り値は「伸び具合」の生の値。
 */
function tailCurve(elapsed: number, duration: number, overshoot: number): number {
  const os = overshoot / 100;
  if (elapsed < duration) {
    const u = elapsed / duration;
    const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return (1 + os) * ease;
  }
  const relax = Math.max(1, duration * 0.45);
  const v = Math.min(1, (elapsed - duration) / relax);
  return 1 + os * Math.pow(1 - v, 3);
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
      /* 吹き出しの歪みをならしつつ、しっぽを引っ込めた形も用意する */
      const tail = bubbleTune.tail;
      const tailStart = Math.max(0, 1 - tail.retract / 100);
      const plan = bubble ? prepareBubble(bubble, bubbleTune) : null;
      const tailPlan = tail.duration > 0 && tail.retract > 0 ? plan : null;
      /* まずしっぽが引っ込んだ形にしておく */
      if (bubble && tailPlan) drawTail(bubble, tailPlan, tailStart);
      /* 上下の振り分けは高さではなくSVGのグループ構造で行う
         （高さだと「たまらない」の上に飛び出た点が上段に混ざる） */
      const upperG = Array.from(svg.querySelectorAll("g")).find((g) =>
        (g.id || "").includes("んにもない")
      );
      const upper = upperG
        ? rest.filter((i) => upperG.contains(i.p)) // な〜んにもない
        : rest.filter((i) => i.midY < 205);
      const lower = rest.filter((i) => !upper.includes(i)); // たまらない＋あしらい

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

      /* 1. 吹き出し（しっぽは引っ込んだ丸い形で出てくる） */
      const t0 = timing.start;
      blurIn(bubble ? [bubble] : [], t0, 900, 16);

      /* 1.5 しっぽがじわーっと下へ伸びる（＝しゃべり出す） */
      let tailEndAt = t0 + 950;
      if (bubble && tailPlan) {
        const totalMs = tail.duration * 1.45;
        tailEndAt = Math.max(tailEndAt, t0 + tail.delay + totalMs + 50);
        setTimeout(() => {
          if (aborted) return;
          let from: number | null = null;
          const tick = (now: number) => {
            if (aborted || !bubble.isConnected) return;
            if (from === null) from = now;
            const elapsed = now - from;
            const raw = tailCurve(elapsed, tail.duration, tail.overshoot);
            drawTail(bubble, tailPlan, tailStart + (1 - tailStart) * raw);
            if (elapsed < totalMs) requestAnimationFrame(tick);
            else drawTail(bubble, tailPlan, 1); /* 最後はきっちり本来の形へ */
          };
          requestAnimationFrame(tick);
        }, t0 + tail.delay);
      }

      /* 登場としっぽ伸ばしが済んだらムニムニ開始 */
      if (bubble && bubbleAnim) {
        setTimeout(() => {
          if (!aborted) startBubbleAnim(bubble, svg, bubbleAnim, bubbleTune);
        }, tailEndAt);
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

      /* ボタンは「たまらない」と同時に出す（t2起点） */
      onScheduled?.(t2);
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
