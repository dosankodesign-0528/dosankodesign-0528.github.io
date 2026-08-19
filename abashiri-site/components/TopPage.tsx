"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent,
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

/* タイトルは仮のものあり。正式名称が決まったら差し替える。
   v1.1: スポットのカード列は SpotShowcase（KV直下の全画面セクション）に置き換わった */
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

/* カードホバー（採用案：グラデが現れて、スポット名が下からすっと上がる） */
export type CardHover = { overlay: string; title: string };
const CARD_HOVER: CardHover = {
  overlay:
    "opacity-0 transition-opacity duration-500 ease-standard group-hover:opacity-100",
  title:
    "translate-y-[18px] opacity-0 transition-all delay-75 duration-500 ease-standard group-hover:translate-y-0 group-hover:opacity-100",
};

function Card({
  card,
  index,
  hover = CARD_HOVER,
}: {
  card: CardData;
  index: number;
  hover?: CardHover;
}) {
  const ov = hover;
  return (
    <motion.div
      variants={cardReveal}
      custom={index}
      className="relative h-[410px] w-[730px] shrink-0"
    >
      <div className="group h-full w-full overflow-hidden rounded-290 border-8 border-white/70">
        <img
          src={card.src}
          alt={card.alt}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        {/* ホバー：下から黒グラデ+ブラーの上にスポット名 */}
        <div
          className={`absolute inset-0 flex items-end justify-center rounded-290 bg-gradient-to-b from-transparent to-black/70 pb-10 backdrop-blur-6 ${ov.overlay}`}
        >
          <p className={`text-title-32 font-medium leading-[1.2] text-white ${ov.title}`}>
            {card.title}
          </p>
        </div>
      </div>
      <p className="font-num pointer-events-none absolute left-[-16px] top-[-65px] text-number-140 font-thin leading-none text-white opacity-70">
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
  hover,
}: {
  cards: CardData[];
  rowIndex: number;
  registerRow: (i: number, el: HTMLDivElement | null) => void;
  hover?: CardHover;
}) {
  return (
    <div
      ref={(el) => registerRow(rowIndex, el)}
      className="no-scrollbar -mt-20 ml-[calc((980px-100cqw)/2)] w-[100cqw] overflow-x-auto pt-20"
    >
      <div className="flex w-max gap-20 pl-30 pr-15">
        {cards.map((c, i) => (
          <Card key={c.src} card={c} index={i} hover={hover} />
        ))}
      </div>
    </div>
  );
}

/* もっと見る（採用案：アイコンが右へ 10px スッと動いて戻る） */
export type MoreAnim = { text: string; icon: string };
const MORE_ANIM: MoreAnim = {
  text: "",
  icon: "transition-transform duration-300 ease-standard group-hover:translate-x-[10px]",
};

function ViewMore({ anim = MORE_ANIM }: { anim?: MoreAnim }) {
  const a = anim;
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group flex cursor-pointer items-center gap-6 text-control-20 font-medium text-white"
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
import SpotShowcase from "./SpotShowcase";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";
import { DEFAULT_BIRDS, type BirdsConfig } from "./birdConfig";
import { type BubbleTune } from "./bubbleConfig";
import { buildShadow, mergeShadow, type ShadowTune } from "./shadowConfig";
import { mergeLayout, type LayoutTune } from "./layoutConfig";
import { mergeSpotTransition, type SpotTransition } from "./spotTransition";
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
  cardHover,
  moreAnim,
  bubbleAnim = 0,
  bubbleTune,
  frameShadow,
  shadowTune,
  layout,
  spotTune,
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
  /** 比較mock専用：カードホバーの見せ方を差し替える（通常は指定しない） */
  cardHover?: CardHover;
  /** 比較mock専用：もっと見るのホバーを差し替える（通常は指定しない） */
  moreAnim?: MoreAnim;
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
  /** KV → ぼーっとスポットの入れ替わりのタイミング（spotTransition.ts） */
  spotTune?: Partial<SpotTransition> | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ip = INTRO_PATTERNS[intro] ?? INTRO_PATTERNS[2];
  const kp = KV_PATTERNS[kv] ?? KV_PATTERNS[1];
  /* 入れ替わりのタイミング（作字が消える → 背景ブラー → スポットが晴れる → 固定） */
  const T = mergeSpotTransition(spotTune);

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

  /* v1.2: 「網走市観光サイト」は吹き出しと同時に出す（ヒデさん指示 2026-08-19）。
     以前はボタンと一緒（＝書き終わったあと）だったが、吹き出しに添えた見出しなので
     吹き出しと同じ瞬間に、同じ 900ms・ブラー16px で現れる方が自然。
     HeroBlurSeq 側の吹き出しも「環境音の確認が済んでから timing.start 後」に
     始まるので、同じ条件で合わせている */
  const [kankoIn, setKankoIn] = useState(!animated);
  useEffect(() => {
    if (!animated || !go) return;
    const id = window.setTimeout(() => setKankoIn(true), timing.start);
    return () => window.clearTimeout(id);
  }, [animated, go, timing.start]);

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
  /* 作字が消えきるまでの距離。
     トップページは spotTransition.ts 側で「作字 → 背景 → スポット → 固定」の
     順番ごと管理しているので、そこの kvOut を使う。
     /mock/kv/[n] のようにパターンを見比べる時だけ、そのパターンの range を使う */
  const kvRange = kv === 1 ? T.kvOut : kp.range;
  const heroBlur = useTransform(
    scrollY,
    [0, kvRange * 0.45, kvRange],
    [0, kp.blurMax * 0.35, kp.blurMax]
  );
  const heroOpacity = useTransform(
    scrollY,
    [0, kvRange * kp.fadeStart, kvRange],
    [1, 0.55, 0]
  );
  const heroScale = useTransform(scrollY, [0, kvRange], kp.scale);
  const heroY = useTransform(scrollY, [0, kvRange], kp.y);
  const buttonY = useTransform(scrollY, [0, kvRange], [0, kp.buttonParallax ?? 0]);
  const heroFilter = useMotionTemplate`blur(${heroBlur}px)`;
  const heroPointer = useTransform(heroOpacity, (v) => (v < 0.06 ? "none" : "auto"));

  /* 背景写真：作字が消えていく流れに続いてブラーがかかっていく（spotTransition の ②）。
     ボケた時に端が透けないよう、ブラー量に応じて少しだけ拡大して補正 */
  const bgBlur = useTransform(
    scrollY,
    [0, T.bgFrom, T.bgTo],
    [0, T.bgBlur * 0.5, T.bgBlur]
  );

  /* 人物イラストは KV だけのもの。ぼーっとスポットのカンプ（15191:2178）には
     いないので、作字が消えるのに合わせて見送る */
  useMotionValueEvent(scrollY, "change", (v) => {
    const t = Math.max(0, Math.min(1, (v - T.kvOut * 0.4) / (T.kvOut * 0.6)));
    window.dispatchEvent(
      new CustomEvent("abashiri:illust-fade", { detail: { v: 1 - t } })
    );
  });
  const bgFilter = useMotionTemplate`blur(${bgBlur}px)`;
  const bgZoom = kp.bgZoom ?? [1, 1];
  /* ブラー時に端が透けないよう、ズームに少し上乗せ（+0.08まで） */
  const bgScale = useTransform(
    scrollY,
    [0, T.bgFrom, T.bgTo],
    [
      bgZoom[0],
      bgZoom[0] + 0.04,
      Math.max(bgZoom[0], bgZoom[1]) + 0.08,
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
      /* v1.1: タブレットのモック枠をやめて画面いっぱいに。
         白ベゼル30px・角丸60px・浮遊シャドウはカンプ 15071:24641 から無くなった */
      className="absolute inset-0"
    >
      <div
        ref={scrollerRef}
        /* data-abashiri-scroller: ヘッダーの「ホーム」がここを探して一番上へ戻す。
           このページは window ではなくこの箱の中がスクロールするので、
           普通の「/」リンクでは何も起きない */
        data-abashiri-scroller=""
        className="no-scrollbar h-full w-full overflow-y-auto overflow-x-clip overscroll-contain bg-sky-bottom [container-type:inline-size]"
      >
        {/* 固定背景（灯台の写真）：中身だけがその上をスクロールする。
            パターンによってはスクロールに合わせてゆっくりズーム。
            下地を写真上端と同じ空色にして、角や継ぎ目が出ないようにする */}
        <div className="pointer-events-none sticky top-0 h-[982px] w-full overflow-hidden bg-brand">
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
        <div className="pointer-events-none sticky top-0 -mt-[982px] h-[982px]">
          <motion.div
            className="flex h-full flex-col items-center pt-[150px]"
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
              className="flex flex-col items-center gap-8"
              style={{
                filter: heroFilter,
                opacity: heroOpacity,
                scale: heroScale,
                y: heroY,
                pointerEvents: heroPointer,
              }}
            >
              {/* v1.2 カンプ 15332:21660（更新版）の実測
                    作字ブロック Frame1000007277 … 415 x 379
                    作字 Group1137              … (0.22, 37.47) 414.56 x 341.34
                    網走市観光サイト Group1143   … (215.73, 8.34) 188.16 x 36.28
                    ボタンとの間                … gap 32px（ボタンは上から411px）
                  ⚠️ 書き出し済みの hero-message.svg は 471x390 で、絵の外側に
                     左右28.22 / 上下24.33 の余白を持っている。
                     そのぶん左上へずらして、絵がカンプの座標に来るようにしている
                     （SVGを作り直すと blurSeq のグループ構造に依存した演出が壊れるため、
                      SVGはそのままで置き方だけ合わせる） */}
              <div className="relative h-[379px] w-[415px]">
              <img
                src="/img/text-kanko-site.svg"
                alt="網走市観光サイト"
                /* 出るタイミングは吹き出しと同じ（duration 900ms / blur 16px も揃えてある） */
                className={`absolute left-[215.7px] top-[8.3px] h-[36.3px] w-[188.2px] transition-all duration-[900ms] ease-standard ${
                  animated && !kankoIn ? "opacity-0 blur-[16px]" : "opacity-100 blur-0"
                }`}
              />
              <div className="absolute left-[-28px] top-[13.1px]">
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
              </div>
              </div>
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
                  {/* v1.2 カンプ 15071:24707（4倍で書き出して実測）
                      枠 … 1px・白40%（地 rgb86 に対して枠 rgb154 → (154-86)/169 = 0.40）
                      地 … 白10%（外 rgb68 に対して rgb86 ＝ 68+187*0.1）・backdrop-blur 65px
                      文字は Noto Sans JP Medium 16px 白・行間 1.2・左右44px/上下16px
                      枠は v1.1 では 2px と読んでいたが、更新版のカンプでは 1px。
                      border ではなく内側のリングにしているのは、border だと枠のぶん
                      ボタンが 218x53.2 に太り、カンプの 216x51 とずれるため */}
                  <Link
                    href="/experience"
                    className="flex items-center justify-center rounded-full bg-white/10 px-11 py-4 text-body-16 font-medium leading-[1.2] text-white ring-1 ring-inset ring-white/40 backdrop-blur-65 transition-transform hover:scale-105"
                  >
                    ぼーっとしてみる
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* ぼーっとスポット（カンプ 15191:2178）。
            KV がブラーで奥へ引くのと入れ替わりに、ここの写真がブラーから合ってくる。
            晴れきったところで固定ビューになり、そのあと下へ進める（spotTransition.ts） */}
        <SpotShowcase scrollY={scrollY} tune={spotTune} />

        {/* v1.1: ここから下にあった3つ（プロモ「ぼーっとする、やってみない？」／
            素朴なグルメ／体験・イベント）は、作り直しのため 2026-08-18 に画面から外した。
            消したのは JSX だけ。Card / CardRow / ViewMore / GOURMET_CARDS / EVENT_CARDS
            などの部品はこのファイルに残してある（復活させる時にそのまま使える）。
            外す前の見た目は v1.0 の URL（https://abashiri-v1.vercel.app）と
            git の ab75656 で確認できる。 */}
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
