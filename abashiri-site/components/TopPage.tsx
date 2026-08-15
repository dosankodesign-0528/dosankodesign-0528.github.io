"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type Variants,
} from "framer-motion";
import Bird from "./Bird";
import GlobalNav from "./GlobalNav";

/* ビューポートに入った時の「上品なブラー解除」共通アニメーション */
const reveal: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(16px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};

type CardData = { src: string; alt: string; title: string };

/* タイトルは仮のものあり。正式名称が決まったら差し替える */
const SPOT_CARDS: CardData[] = [
  { src: "/img/spot-1.jpg", alt: "天都山展望台", title: "天都山展望台" },
  { src: "/img/spot-2.jpg", alt: "ひまわり畑", title: "ひまわり畑" },
  { src: "/img/spot-3.jpg", alt: "能取岬", title: "能取岬" },
  { src: "/img/spot-4.jpg", alt: "オホーツクの海", title: "オホーツクの海" },
];
const GOURMET_CARDS: CardData[] = [
  { src: "/img/gourmet-1.jpg", alt: "わかさぎの唐揚げ", title: "わかさぎの唐揚げ" },
  { src: "/img/gourmet-2.jpg", alt: "浜の海鮮焼き", title: "浜の海鮮焼き" },
  { src: "/img/gourmet-3.jpg", alt: "地魚の御膳", title: "地魚の御膳" },
  { src: "/img/gourmet-4.jpg", alt: "浜のちゃんこ鍋", title: "浜のちゃんこ鍋" },
];
const EVENT_CARDS: CardData[] = [
  { src: "/img/event-1.jpg", alt: "監獄食体験", title: "監獄食体験" },
  { src: "/img/event-2.jpg", alt: "タオルが凍る極寒体験", title: "タオルが凍る極寒体験" },
  { src: "/img/event-3.jpg", alt: "流氷カヤック", title: "流氷カヤック" },
  { src: "/img/event-4.jpg", alt: "流氷ウォーク", title: "流氷ウォーク" },
];

/* No.付き楕円カード（ホバーで中の写真がズーム）
   No.1 → No.2 → … と少しずつ遅れてブラー出現する */
const cardReveal: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(16px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 + i * 0.25 },
  }),
};

/* ホバー時のオーバーレイ表現（3パターン）
   1: 下からすっと …… グラデが現れて文字が下からスライドイン（カンプ基準）
   2: じんわりフォーカス …… グラデがゆっくり現れ、文字はブラーが晴れてピントが合う
   3: せり上がりワイプ …… グラデの幕が下からせり上がり、文字がぽんと乗る */
const CARD_OVERLAY: Record<number, { overlay: string; title: string }> = {
  1: {
    overlay:
      "opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100",
    title:
      "translate-y-[18px] opacity-0 transition-all delay-75 duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100",
  },
  2: {
    overlay:
      "opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100",
    title:
      "opacity-0 blur-hover transition-all duration-700 ease-out group-hover:opacity-100 group-hover:blur-none",
  },
  3: {
    overlay:
      "translate-y-full transition-transform duration-500 ease-standard group-hover:translate-y-0",
    title:
      "translate-y-[24px] opacity-0 transition-all delay-100 duration-500 ease-bounce group-hover:translate-y-0 group-hover:opacity-100",
  },
};

function Card({
  card,
  index,
  hoverStyle = 1,
}: {
  card: CardData;
  index: number;
  hoverStyle?: number;
}) {
  const ov = CARD_OVERLAY[hoverStyle] ?? CARD_OVERLAY[1];
  return (
    <motion.div
      variants={cardReveal}
      custom={index}
      className="relative h-[410px] w-[730px] shrink-0"
    >
      <div className="group h-full w-full overflow-hidden rounded-card border-8 border-white/70">
        <img
          src={card.src}
          alt={card.alt}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        {/* ホバー：下から黒グラデ+ブラーの上にスポット名 */}
        <div
          className={`absolute inset-0 flex items-end justify-center rounded-card bg-gradient-to-b from-transparent to-black/60 pb-10 backdrop-blur-hover ${ov.overlay}`}
        >
          <p className={`text-title font-medium leading-[1.2] text-white ${ov.title}`}>
            {card.title}
          </p>
        </div>
      </div>
      <p className="font-num pointer-events-none absolute left-[-16px] top-[-65px] text-number font-thin leading-none text-white opacity-80">
        No.{index + 1}
      </p>
    </motion.div>
  );
}

/* カード列はモックの内側いっぱいに広げる（左だけ120pxの余白）。
   980pxのグリッドから左右に飛び出させて、見切れをなくす。
   縦スクロール→横スクロール切替のため ref を登録する */
function CardRow({
  cards,
  rowIndex,
  registerRow,
  hoverStyle = 1,
}: {
  cards: CardData[];
  rowIndex: number;
  registerRow: (i: number, el: HTMLDivElement | null) => void;
  hoverStyle?: number;
}) {
  return (
    <div
      ref={(el) => registerRow(rowIndex, el)}
      className="no-scrollbar -mt-20 ml-[calc((980px-100cqw)/2)] w-[100cqw] overflow-x-auto pt-20"
    >
      <div className="flex w-max gap-20 pl-30 pr-15">
        {cards.map((c, i) => (
          <Card key={c.src} card={c} index={i} hoverStyle={hoverStyle} />
        ))}
      </div>
    </div>
  );
}

/* もっと見る（新デザイン：テキスト+62pxの丸アイコン）のホバーアニメ3パターン
   1: 矢印スライド …… アイコンが右へ10pxスッと動いて戻る
   2: くるっと回転 …… アイコンが一回転しながら少し大きくなる
   3: ふわっと開く …… テキストとアイコンの間がふわっと広がる */
const MORE_ANIM: Record<number, { text: string; icon: string }> = {
  1: {
    text: "",
    icon: "transition-transform duration-300 ease-out group-hover:translate-x-[10px]",
  },
  2: {
    text: "",
    icon: "transition-transform duration-500 ease-bounce group-hover:rotate-[360deg] group-hover:scale-110",
  },
  3: {
    text: "transition-transform duration-300 ease-out group-hover:-translate-x-[6px]",
    icon: "transition-transform duration-300 ease-out group-hover:translate-x-[8px] group-hover:scale-105",
  },
};

function ViewMore({ anim = 1 }: { anim?: number }) {
  const a = MORE_ANIM[anim] ?? MORE_ANIM[1];
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group flex cursor-pointer items-center gap-6 text-action font-medium text-white"
    >
      <span className={a.text}>もっと見る</span>
      <img
        src="/img/icon-more-circle.svg"
        alt=""
        className={`size-[62px] ${a.icon}`}
      />
    </a>
  );
}

import { INTRO_PATTERNS } from "./introPatterns";
import { KV_PATTERNS } from "./kvPatterns";
import HeroWriting from "./HeroWriting";
import HeroKamishibai from "./HeroKamishibai";
import HeroCombo from "./HeroCombo";
import HeroBlurSeq from "./HeroBlurSeq";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";
import { DEFAULT_BIRDS, type BirdsConfig } from "./birdConfig";
import { type BubbleTune } from "./bubbleConfig";
import { buildShadow, mergeShadow, type ShadowTune } from "./shadowConfig";
import { mergeLayout, type LayoutTune } from "./layoutConfig";
import { waitForConsent } from "./consentGate";

/** イラスト出現の合図（Stage が拾う） */
export const ILLUST_IN_EVENT = "abashiri:illust-in";

export default function TopPage({
  intro = 2,
  kv = 1,
  write = 0,
  writePace = 2,
  kami = 0,
  combo = false,
  blurSeq = false,
  timing = DEFAULT_HERO_TIMING,
  birds = DEFAULT_BIRDS,
  birdsEditable = false,
  onBirdMove,
  waitConsent = false,
  cardHover = 1,
  moreAnim = 1,
  bubbleAnim = 0,
  bubbleTune,
  frameShadow,
  shadowTune,
  layout,
}: {
  intro?: number;
  kv?: number;
  /** 1〜3: 手書きパスアニメーション（0は通常表示） */
  write?: number;
  /** 1〜3: 書くスピード（WRITE_PACES） */
  writePace?: number;
  /** 1〜3: 紙芝居パターン（伸ばし棒ビヨーン。writeより優先） */
  kami?: number;
  /** true: なぞり書き+ビヨーン版（旧候補） */
  combo?: boolean;
  /** true: 決定版（吹き出し→な〜んにもない→たまらない を順にブラー） */
  blurSeq?: boolean;
  /** 登場演出のタイミング設定（heroTiming.ts） */
  timing?: HeroTiming;
  /** カモメの配置・見た目（birdConfig.ts） */
  birds?: BirdsConfig;
  /** true: カモメをドラッグで動かせる（調整パネル用） */
  birdsEditable?: boolean;
  /** ドラッグでカモメが動いた時の通知（調整パネル用） */
  onBirdMove?: (key: "promo1" | "promo2", patch: { x: number; y: number }) => void;
  /** true: 環境音のON/OFF確認が済むまで登場演出を待つ */
  waitConsent?: boolean;
  /** 1〜3: カードホバーのオーバーレイ表現 */
  cardHover?: number;
  /** 1〜3: もっと見るボタンのホバーアニメ */
  moreAnim?: number;
  /** 1〜3: 吹き出しのムニムニアニメ（0でなし） */
  bubbleAnim?: number;
  /** 吹き出しの平滑化・ぷにぷに呼吸のパラメーター（bubbleConfig.ts） */
  bubbleTune?: BubbleTune;
  /** 比較mock専用：影のクラスを外から丸ごと差し替える（通常は指定しない） */
  frameShadow?: string;
  /** 浮遊シャドウの細かい調整（shadowConfig.ts。frameShadow 未指定の時に有効） */
  shadowTune?: Partial<ShadowTune>;
  /** タブレットの位置ずらし（layoutConfig.ts） */
  layout?: Partial<LayoutTune> | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  /* 「ぼーっと過ごせるスポット」見出し（オーバーレイ混色のため出現後に filter を外す） */
  const spotHeadRef = useRef<HTMLDivElement>(null);
  const ip = INTRO_PATTERNS[intro] ?? INTRO_PATTERNS[2];
  const kp = KV_PATTERNS[kv] ?? KV_PATTERNS[1];

  /* アニメが終わってから「ぼーっとしてみる」ボタンをふわっと出す */
  const animated = Boolean(write || kami || combo || blurSeq);
  const [buttonIn, setButtonIn] = useState(!animated);

  /* 環境音のON/OFF確認が済んでからヘッダー等の登場演出を始める */
  const [go, setGo] = useState(!waitConsent);
  useEffect(() => {
    if (!waitConsent) return;
    let alive = true;
    waitForConsent().then(() => {
      if (alive) setGo(true);
    });
    return () => {
      alive = false;
    };
  }, [waitConsent]);

  /* 書き終わり → ボタン → 一番最後にイラスト、の順で出す共通ハンドラ */
  const handleScheduled = (writingEnd: number) => {
    const buttonAt = writingEnd + timing.button.gap;
    const illustAt = buttonAt + timing.button.duration + timing.illust.gap;
    window.setTimeout(() => setButtonIn(true), buttonAt);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(ILLUST_IN_EVENT));
    }, illustAt);
  };

  /* キービジュアル（文字＋ボタン）は画面中央に固定したまま、
     スクロール量に応じてその場で変化しながら消え、
     下からコンテンツがすべり込んで交代する */
  const { scrollY } = useScroll({ container: scrollerRef });
  const heroBlur = useTransform(
    scrollY,
    [0, kp.range * 0.45, kp.range],
    [0, kp.blurMax * 0.35, kp.blurMax]
  );
  const heroOpacity = useTransform(
    scrollY,
    [0, kp.range * kp.fadeStart, kp.range],
    [1, 0.55, 0]
  );
  const heroScale = useTransform(scrollY, [0, kp.range], kp.scale);
  const heroY = useTransform(scrollY, [0, kp.range], kp.y);
  const buttonY = useTransform(scrollY, [0, kp.range], [0, kp.buttonParallax ?? 0]);
  const heroFilter = useMotionTemplate`blur(${heroBlur}px)`;
  const heroPointer = useTransform(heroOpacity, (v) => (v < 0.06 ? "none" : "auto"));

  /* 背景写真：スクロールすると早めに濃いめのブラーがかかっていく。
     ボケた時に端が透けないよう、ブラー量に応じて少しだけ拡大して補正 */
  const bgBlur = useTransform(scrollY, [0, 160, 400], [0, 8, 16]);
  const bgFilter = useMotionTemplate`blur(${bgBlur}px)`;
  const bgZoom = kp.bgZoom ?? [1, 1];
  /* ブラー時に端が透けないよう、ズームに少し上乗せ（+0.08まで） */
  const bgScale = useTransform(
    scrollY,
    [0, 160, 400, kp.range],
    [
      bgZoom[0],
      bgZoom[0] + 0.04,
      Math.max(bgZoom[0], bgZoom[1]) + 0.08,
      bgZoom[1] + 0.08,
    ]
  );

  const viewport = { root: scrollerRef, once: true, amount: 0.2 } as const;

  /* 調整パネル用：プロモ内カモメをドラッグで動かす（%座標） */
  const dragPromoBird =
    (key: "promo1" | "promo2") => (e: React.PointerEvent) => {
      if (!birdsEditable || !onBirdMove) return;
      e.preventDefault();
      e.stopPropagation();
      const parent = (e.currentTarget as HTMLElement).parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const start = { px: e.clientX, py: e.clientY, x: birds[key].x, y: birds[key].y };
      const move = (ev: PointerEvent) => {
        onBirdMove(key, {
          x: Math.round((start.x + ((ev.clientX - start.px) / rect.width) * 100) * 10) / 10,
          y: Math.round((start.y + ((ev.clientY - start.py) / rect.height) * 100) * 10) / 10,
        });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

  /* ===== カード列：縦スクロールで来たら、No.4まで横に流れてから縦に戻る ===== */
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const registerRow = useCallback((i: number, el: HTMLDivElement | null) => {
    rowsRef.current[i] = el;
  }, []);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;

    /* 3段階で切り替える：
       1) セットが中央付近に来たら縦を引き受けて、じわっと中央へ吸着
       2) 吸着後に少し「ゆとり」（350ms）
       3) 横送り開始。ホイール量は目標値へ貯めて、慣性で追いかける

       重要：端まで送り切ったら「完了方向」を記憶して、その方向の入力は
       セクションが画面から外れるまで素通しする（実位置が慣性で追いつく前に
       再ロックして無限ループになるバグの根本対策） */
    type Lock = {
      row: HTMLDivElement;
      target: number;
      engagedAt: number;
      done: false | "fwd" | "back";
    };
    let lock: Lock | null = null;
    let raf = 0;
    /* 縦スクロールも慣性化：目標値へなめらかに追いかける */
    let targetY = sc.scrollTop;

    const tick = () => {
      raf = 0;
      let busy = false;
      /* 縦の慣性 */
      const dy = targetY - sc.scrollTop;
      if (Math.abs(dy) > 0.5) {
        sc.scrollTop += dy * 0.12;
        busy = true;
      } else if (dy !== 0) {
        sc.scrollTop = targetY;
      }
      /* カルーセルの横の慣性 */
      if (lock) {
        const cur = lock.row.scrollLeft;
        const diff = lock.target - cur;
        if (Math.abs(diff) > 0.5) {
          lock.row.scrollLeft = cur + diff * 0.13;
          busy = true;
        } else {
          lock.row.scrollLeft = lock.target; /* 終端で正確に止める */
        }
      }
      if (busy) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    /* アンカージャンプなど外部からのスクロールに目標値を同期 */
    const onScroll = () => {
      if (!raf) targetY = sc.scrollTop;
    };
    sc.addEventListener("scroll", onScroll, { passive: true });

    const onWheel = (e: WheelEvent) => {
      /* トラックパッドの横ジェスチャはネイティブの横スクロールに任せる */
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const scRect = sc.getBoundingClientRect();
      if (scRect.height < 10) return; /* 非表示中など計測不能時は素通し */
      const scale = scRect.height / sc.clientHeight;
      const viewCenter = scRect.top + scRect.height / 2;

      /* 中央帯にいるセクションのカード列を探す */
      let row: HTMLDivElement | null = null;
      let dist = 0;
      for (const r of rowsRef.current) {
        if (!r) continue;
        const sec = r.closest("section");
        if (!sec) continue;
        const sr = sec.getBoundingClientRect();
        const d = sr.top + sr.height / 2 - viewCenter;
        if (Math.abs(d) <= scRect.height * 0.16) {
          row = r;
          dist = d;
          break;
        }
      }

      /* 帯の外に出たらロック解除して、縦は慣性スクロール */
      if (!row) {
        lock = null;
        e.preventDefault();
        targetY = Math.max(
          0,
          Math.min(sc.scrollHeight - sc.clientHeight, targetY + e.deltaY)
        );
        kick();
        return;
      }
      if (!lock || lock.row !== row) {
        lock = {
          row,
          target: row.scrollLeft,
          /* すでに中央付近ならゆとり待ちをスキップ */
          engagedAt:
            Math.abs(dist) < scRect.height * 0.05 ? 0 : performance.now(),
          done: false,
        };
      }

      const max = row.scrollWidth - row.clientWidth;
      if (max <= 0) return;
      const down = e.deltaY > 0;

      /* 完了方向へのさらなる入力は縦の慣性スクロールへ */
      if ((lock.done === "fwd" && down) || (lock.done === "back" && !down)) {
        e.preventDefault();
        targetY = Math.max(
          0,
          Math.min(sc.scrollHeight - sc.clientHeight, targetY + e.deltaY)
        );
        kick();
        return;
      }
      /* 逆方向の入力が来たら完了状態を解除（巻き戻しできる） */
      if (lock.done) lock.done = false;

      e.preventDefault();

      /* 1) 中央へじわっと吸着。
         「今の位置＋ズレ」＝センターに合う絶対位置を目標にする。
         毎回同じ値に収束するので、足し込みすぎによるガタつきが起きない */
      if (Math.abs(dist) > 3) {
        const desiredY = sc.scrollTop + dist / scale;
        targetY = Math.max(
          0,
          Math.min(sc.scrollHeight - sc.clientHeight, desiredY)
        );
        kick();
      }

      /* 2) 吸着が済んで少し間が空いてから 3) 横送り */
      const settled =
        performance.now() - lock.engagedAt > 350 &&
        Math.abs(dist) < scRect.height * 0.05;
      if (settled) {
        lock.target = Math.max(0, Math.min(max, lock.target + e.deltaY));
        kick();
        /* 端まで送り切ったら完了方向を記憶 */
        if (down && lock.target >= max - 0.5) lock.done = "fwd";
        if (!down && lock.target <= 0.5) lock.done = "back";
      }
    };
    sc.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      sc.removeEventListener("wheel", onWheel);
      sc.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const L = mergeLayout(layout);

  return (
    <div
      className={`absolute left-[76px] right-[206px] top-[87px] h-[1005px] rounded-t-device border-[30px] border-white ${frameShadow ?? ""}`}
      style={{
        ...(frameShadow ? {} : { boxShadow: buildShadow(mergeShadow(shadowTune)) }),
        transform: `translate(${L.tabletX}px, ${L.tabletY}px)`,
      }}
    >
      <div
        ref={scrollerRef}
        className="no-scrollbar h-full w-full overflow-y-auto overflow-x-clip overscroll-contain rounded-t-device-inner bg-scroller [container-type:inline-size]"
      >
        {/* 固定背景（灯台の写真）：中身だけがその上をスクロールする。
            パターンによってはスクロールに合わせてゆっくりズーム。
            下地を写真上端と同じ空色にして、角や継ぎ目が出ないようにする */}
        <div className="pointer-events-none sticky top-0 h-[945px] w-full overflow-hidden bg-brand">
          {/* Figmaのトリミング・色加工を焼き込み、角丸の縁を切り落とした四角い書き出し画像。
              角丸はCSS側だけで付けるので、継ぎ目やズレが出ない */}
          <motion.img
            src="/img/bg-hero.jpg"
            alt=""
            className="h-full w-full object-cover"
            style={{ scale: bgScale, filter: bgFilter }}
          />
        </div>

        {/* キービジュアル：画面中央に固定されたまま、ブラーで登場 →
            スクロールでその場から奥へ引いて消える */}
        <div className="pointer-events-none sticky top-0 -mt-[945px] h-[865px]">
          <motion.div
            className="flex h-full flex-col items-center pt-30"
            initial={
              animated
                ? { opacity: 1 } /* 手書き/紙芝居アニメ時は書く動き自体が登場演出 */
                : {
                    opacity: 0,
                    filter: `blur(${ip.heroBlur}px)`,
                    y: ip.heroY,
                    scale: ip.heroScale,
                  }
            }
            animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
            transition={{ duration: ip.heroDur, ease: ip.ease, delay: ip.heroDelay }}
          >
            <motion.div
              className="flex flex-col items-center gap-6"
              style={{
                filter: heroFilter,
                opacity: heroOpacity,
                scale: heroScale,
                y: heroY,
                pointerEvents: heroPointer,
              }}
            >
              {blurSeq ? (
                <HeroBlurSeq
                  timing={timing}
                  gate={waitConsent}
                  bubbleAnim={bubbleAnim}
                  bubbleTune={bubbleTune}
                  onScheduled={handleScheduled}
                />
              ) : combo ? (
                <HeroCombo
                  pace={writePace}
                  timing={timing}
                  onScheduled={handleScheduled}
                />
              ) : kami ? (
                <HeroKamishibai
                  variant={kami}
                  pace={writePace}
                  timing={timing}
                  onScheduled={handleScheduled}
                />
              ) : write ? (
                <HeroWriting
                  pace={writePace}
                  timing={timing}
                  onScheduled={handleScheduled}
                />
              ) : (
                <img
                  src="/img/hero-message.svg"
                  alt="な〜んにもない たまらない"
                  className="h-[390px] w-[471px]"
                />
              )}
              <motion.div style={{ y: buttonY }}>
                {/* 手書きが終わったあと、ブラーがふわっと晴れて出てくる */}
                <motion.div
                  initial={
                    animated
                      ? { opacity: 0, filter: `blur(${timing.button.blur}px)`, y: 10 }
                      : false
                  }
                  animate={buttonIn ? { opacity: 1, filter: "blur(0px)", y: 0 } : undefined}
                  transition={{
                    duration: timing.button.duration / 1000,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href="/experience"
                    className="rounded-full bg-white/90 px-11 py-4 text-action font-black text-brand backdrop-blur-hover transition-transform hover:scale-105"
                  >
                    ぼーっとしてみる
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* z-index は付けない：付けると独立した重なりグループになり、
            見出しの「ぼーっ」のオーバーレイ混色が背景写真まで届かなくなる。
            KV より後ろのDOM順なので、relative だけで手前に描画される */}
        <div className="pointer-events-none relative -mt-[865px]">

          <div className="mx-auto flex w-[980px] flex-col items-center pb-50 pt-[1005px]">
            <div className="pointer-events-auto relative flex w-full flex-col gap-75">
              {/* ぼーっと過ごせるスポット ＋ プロモ */}
              <div className="flex w-full flex-col gap-20">
                <motion.section
                  id="spot"
                  className="flex w-full flex-col gap-30"
                  initial="hidden"
                  whileInView="show"
                  viewport={viewport}
                  variants={stagger}
                >
                  <motion.div
                    ref={spotHeadRef}
                    variants={reveal}
                    className="flex w-full items-end justify-between"
                    /* 登場アニメが残す filter/transform はスタッキングコンテキストを
                       作ってしまい、「ぼーっ」のオーバーレイ混色が背景写真に届かない。
                       出現し終わったら消して、カンプ通り写真と混ざるようにする */
                    onAnimationComplete={() => {
                      const el = spotHeadRef.current;
                      if (el) {
                        el.style.filter = "none";
                        el.style.transform = "none";
                      }
                    }}
                  >
                    <div className="flex items-start">
                      <div className="mix-blend-overlay">
                        <img
                          src="/img/header-botto.svg"
                          alt="ぼーっ"
                          className="w-[140px] -rotate-[0.42deg]"
                        />
                      </div>
                      <p className="ml-[3px] mt-2 text-section font-medium leading-[1.2] text-white">
                        と過ごせるスポット
                      </p>
                    </div>
                    <ViewMore anim={moreAnim} />
                  </motion.div>
                  <CardRow cards={SPOT_CARDS} rowIndex={0} registerRow={registerRow} hoverStyle={cardHover} />
                </motion.section>

                {/* ぼーっとする、やってみない？ */}
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={viewport}
                  variants={reveal}
                >
                  <Link
                    href="/experience"
                    className="relative flex w-full flex-col items-center justify-center gap-8 overflow-clip rounded-panel bg-brand/90 px-4 py-15 backdrop-blur-glass-strong transition-transform duration-500 hover:scale-[1.01]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-lead font-bold leading-[1.4] text-white">
                        旅行する前に
                      </p>
                      <div className="flex items-end justify-center gap-1">
                        <img
                          src="/img/header-botto-sm.svg"
                          alt="ぼーっ"
                          className="w-[103px] -rotate-[0.42deg]"
                        />
                        <p className="text-promo font-bold leading-[1.4] text-white">
                          とする、やってみない？
                        </p>
                      </div>
                    </div>
                    <span className="flex w-[200px] items-center justify-center rounded-full bg-white px-6 py-3 text-label-sm font-black text-brand">
                      さっそく体験する
                    </span>
                    <div
                      className={`absolute ${birdsEditable ? "z-40 cursor-move" : ""}`}
                      onPointerDown={dragPromoBird("promo1")}
                      onClickCapture={(e) => {
                        if (birdsEditable) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      style={{
                        left: `${birds.promo1.x}%`,
                        top: `${birds.promo1.y}%`,
                        width: birds.promo1.w,
                        height: birds.promo1.w * 0.58,
                        transform: `rotate(${birds.promo1.rotate}deg)`,
                      }}
                    >
                      <Bird
                        flapDuration={birds.promo1.flap}
                        driftDuration={birds.promo1.drift}
                        delay={birds.promo1.delay}
                        strokeWidth={birds.promo1.stroke}
                      />
                    </div>
                    <div
                      className={`absolute ${birdsEditable ? "z-40 cursor-move" : ""}`}
                      onPointerDown={dragPromoBird("promo2")}
                      onClickCapture={(e) => {
                        if (birdsEditable) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      style={{
                        left: `${birds.promo2.x}%`,
                        top: `${birds.promo2.y}%`,
                        width: birds.promo2.w,
                        height: birds.promo2.w * 0.58,
                        transform: `rotate(${birds.promo2.rotate}deg)`,
                      }}
                    >
                      <Bird
                        flapDuration={birds.promo2.flap}
                        driftDuration={birds.promo2.drift}
                        delay={birds.promo2.delay}
                        strokeWidth={birds.promo2.stroke}
                      />
                    </div>
                  </Link>
                </motion.div>
              </div>

              {/* 素朴なグルメ */}
              <motion.section
                id="gourmet"
                className="flex w-full flex-col gap-30"
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={stagger}
              >
                <motion.div
                  variants={reveal}
                  className="flex w-full items-end justify-between"
                >
                  <div className="flex flex-col items-start gap-4">
                    <img
                      src="/img/bubble-gourmet.svg"
                      alt="地味だけど、美味い"
                      className="w-[304px]"
                    />
                    <p className="text-section font-medium leading-[1.2] text-white">
                      素朴なグルメ
                    </p>
                  </div>
                  <ViewMore anim={moreAnim} />
                </motion.div>
                <CardRow cards={GOURMET_CARDS} rowIndex={1} registerRow={registerRow} hoverStyle={cardHover} />
              </motion.section>

              {/* 体験・イベント */}
              <motion.section
                id="event"
                className="flex w-full flex-col gap-30"
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={stagger}
              >
                <motion.div
                  variants={reveal}
                  className="flex w-full items-end justify-between"
                >
                  <div className="flex flex-col items-start gap-4">
                    <img
                      src="/img/bubble-event.svg"
                      alt="気が向いたら、これ"
                      className="w-[287px]"
                    />
                    <p className="text-section font-medium leading-[1.2] text-white">
                      体験・イベント
                    </p>
                  </div>
                  <ViewMore anim={moreAnim} />
                </motion.div>
                <CardRow cards={EVENT_CARDS} rowIndex={2} registerRow={registerRow} hoverStyle={cardHover} />
              </motion.section>
            </div>
          </div>
        </div>
      </div>

      {/* 追従ヘッダー：スクロールの外に置いて常に表示 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, filter: `blur(${ip.headerBlur}px)`, y: ip.headerY }}
          animate={go ? { opacity: 1, filter: "blur(0px)", y: 0 } : undefined}
          transition={{
            duration: ip.headerDur,
            ease: ip.ease,
            /* 演出ありの時は、まず景色を見せてから */
            delay: animated ? (timing.start + timing.header.extraDelay) / 1000 : 0,
          }}
        >
          <GlobalNav theme="light" />
        </motion.div>
      </div>

      {/* サウンドON/OFFの置き場：SoundUi がここへ描画する（白モック内の左上） */}
      <div id="abashiri-sound-slot" className="absolute left-[32px] top-[32px] z-40" />
    </div>
  );
}
