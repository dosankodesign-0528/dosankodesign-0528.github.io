"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type Variants,
} from "framer-motion";
import Bird from "./Bird";
import MockNav from "./MockNav";

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

type CardData = { src: string; alt: string };

const SPOT_CARDS: CardData[] = [
  { src: "/img/spot-1.jpg", alt: "能取岬" },
  { src: "/img/spot-2.jpg", alt: "ぼーっとスポット2" },
  { src: "/img/spot-3.jpg", alt: "ぼーっとスポット3" },
  { src: "/img/spot-4.jpg", alt: "ぼーっとスポット4" },
];
const GOURMET_CARDS: CardData[] = [
  { src: "/img/gourmet-1.jpg", alt: "素朴なグルメ1" },
  { src: "/img/gourmet-2.jpg", alt: "素朴なグルメ2" },
  { src: "/img/gourmet-3.jpg", alt: "素朴なグルメ3" },
  { src: "/img/gourmet-4.jpg", alt: "素朴なグルメ4" },
];
const EVENT_CARDS: CardData[] = [
  { src: "/img/event-1.jpg", alt: "体験・イベント1" },
  { src: "/img/event-2.jpg", alt: "体験・イベント2" },
  { src: "/img/event-3.jpg", alt: "体験・イベント3" },
  { src: "/img/event-4.jpg", alt: "体験・イベント4" },
];

/* No.付き楕円カード（ホバーで中の写真がズーム） */
function Card({ card, index }: { card: CardData; index: number }) {
  return (
    <motion.div variants={reveal} className="relative h-[410px] w-[730px] shrink-0">
      <div className="group h-full w-full overflow-hidden rounded-[290px] border-8 border-white/70">
        <img
          src={card.src}
          alt={card.alt}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
      </div>
      <p className="font-rounded pointer-events-none absolute left-[-16px] top-[-65px] text-[140px] font-thin leading-none text-white opacity-80">
        No.{index + 1}
      </p>
    </motion.div>
  );
}

function CardRow({ cards }: { cards: CardData[] }) {
  return (
    <div className="no-scrollbar -mt-[80px] w-[980px] overflow-x-auto pt-[80px]">
      <div className="flex w-max gap-[80px]">
        {cards.map((c, i) => (
          <Card key={c.src} card={c} index={i} />
        ))}
      </div>
    </div>
  );
}

function ViewMore() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-[4px] text-[20px] font-medium text-white transition-opacity hover:opacity-70"
    >
      もっと見る
      <img src="/img/icon-arrow.svg" alt="" className="size-[18px]" />
    </a>
  );
}

import { INTRO_PATTERNS } from "./introPatterns";

export default function TopMock({ intro = 1 }: { intro?: number }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ip = INTRO_PATTERNS[intro] ?? INTRO_PATTERNS[1];

  /* スクロールに連れてキービジュアル（文字＋ボタン）が
     奥へ下がりながらボケて消えていく */
  const { scrollY } = useScroll({ container: scrollerRef });
  const heroBlur = useTransform(scrollY, [0, 300, 620], [0, 9, 24]);
  const heroOpacity = useTransform(scrollY, [0, 420, 640], [1, 0.5, 0]);
  const heroScale = useTransform(scrollY, [0, 640], [1, 0.76]);
  const heroYScroll = useTransform(scrollY, [0, 640], [0, 250]);
  const heroFilter = useMotionTemplate`blur(${heroBlur}px)`;
  const heroPointer = useTransform(heroOpacity, (v) => (v < 0.06 ? "none" : "auto"));

  const viewport = { root: scrollerRef, once: true, amount: 0.2 } as const;

  return (
    <div className="absolute left-[calc(50%-71px)] top-[87px] h-[960px] w-[1230px] -translate-x-1/2 rounded-[60px] border-[30px] border-white shadow-[0px_28px_16px_0px_#0f98c2]">
      <div
        ref={scrollerRef}
        className="no-scrollbar h-full w-full overflow-y-auto overflow-x-clip rounded-[30px] bg-[#8ec6ea]"
      >
        {/* 固定背景（灯台の写真）：中身だけがその上をスクロールする */}
        <div className="pointer-events-none sticky top-0 h-[865px] w-full overflow-hidden">
          <img
            src="/img/bg-hero.jpg"
            alt=""
            className="h-full w-full object-cover object-bottom"
          />
        </div>

        <div className="relative -mt-[865px]">
          {/* ヘッダー：ブラーで登場 */}
          <motion.div
            initial={{ opacity: 0, filter: `blur(${ip.headerBlur}px)`, y: ip.headerY }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: ip.headerDur, ease: ip.ease }}
          >
            <MockNav theme="light" />
          </motion.div>

          <div className="mx-auto flex w-[980px] flex-col items-center gap-[280px] py-[120px]">
            {/* キービジュアル：ブラーで登場 → スクロールで奥へ下がって消える */}
            <motion.div
              initial={{
                opacity: 0,
                filter: `blur(${ip.heroBlur}px)`,
                y: ip.heroY,
                scale: ip.heroScale,
              }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
              transition={{ duration: ip.heroDur, ease: ip.ease, delay: ip.heroDelay }}
            >
              <motion.div
                className="flex flex-col items-center gap-[24px]"
                style={{
                  filter: heroFilter,
                  opacity: heroOpacity,
                  scale: heroScale,
                  y: heroYScroll,
                  pointerEvents: heroPointer,
                }}
              >
                <img
                  src="/img/hero-message.svg"
                  alt="な〜んにもない たまらない"
                  className="h-[390px] w-[471px]"
                />
                <Link
                  href="/experience"
                  className="rounded-full bg-white/90 px-[44px] py-[16px] text-[20px] font-black text-[#0070c9] backdrop-blur-[3px] transition-transform hover:scale-105"
                >
                  ぼーっとしてみる
                </Link>
              </motion.div>
            </motion.div>

            <div className="relative z-10 flex w-full flex-col gap-[300px]">
              {/* ぼーっと過ごせるスポット ＋ プロモ */}
              <div className="flex w-full flex-col gap-[80px]">
                <motion.section
                  id="spot"
                  className="flex w-full flex-col gap-[120px]"
                  initial="hidden"
                  whileInView="show"
                  viewport={viewport}
                  variants={stagger}
                >
                  <motion.div
                    variants={reveal}
                    className="flex w-full items-end justify-between"
                  >
                    <div className="flex items-start">
                      <div className="mix-blend-overlay">
                        <img
                          src="/img/header-botto.svg"
                          alt="ぼーっ"
                          className="w-[140px] -rotate-[0.42deg]"
                        />
                      </div>
                      <p className="ml-[3px] mt-[8px] text-[48px] font-medium leading-[1.2] text-white">
                        と過ごせるスポット
                      </p>
                    </div>
                    <ViewMore />
                  </motion.div>
                  <CardRow cards={SPOT_CARDS} />
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
                    className="relative flex w-full flex-col items-center justify-center gap-[32px] overflow-clip rounded-[24px] bg-[rgba(0,123,221,0.7)] px-[16px] py-[60px] backdrop-blur-[40px] transition-transform duration-500 hover:scale-[1.01]"
                  >
                    <div className="flex flex-col items-center gap-[4px]">
                      <p className="text-[18px] font-bold leading-[1.4] text-white">
                        旅行する前に
                      </p>
                      <div className="flex items-end justify-center gap-[4px]">
                        <img
                          src="/img/header-botto-sm.svg"
                          alt="ぼーっ"
                          className="w-[103px] -rotate-[0.42deg]"
                        />
                        <p className="text-[34px] font-bold leading-[1.4] text-white">
                          とする、やってみない？
                        </p>
                      </div>
                    </div>
                    <span className="flex w-[200px] items-center justify-center rounded-[38px] bg-white px-[24px] py-[10px] text-[14px] font-black text-[#0070c9]">
                      さっそく体験する
                    </span>
                    <div className="absolute right-[4.3%] top-[17%] h-[60px] w-[100px]">
                      <Bird flapDuration={0.6} driftDuration={8} />
                    </div>
                    <div className="absolute left-[0.5%] top-[13%] h-[34px] w-[58px]">
                      <Bird flapDuration={0.48} driftDuration={6} delay={0.8} />
                    </div>
                  </Link>
                </motion.div>
              </div>

              {/* 素朴なグルメ */}
              <motion.section
                id="gourmet"
                className="flex w-full flex-col gap-[120px]"
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={stagger}
              >
                <motion.div
                  variants={reveal}
                  className="flex w-full items-end justify-between"
                >
                  <div className="flex flex-col items-start gap-[16px]">
                    <img
                      src="/img/bubble-gourmet.svg"
                      alt="地味だけど、美味い"
                      className="w-[304px]"
                    />
                    <p className="text-[48px] font-medium leading-[1.2] text-white">
                      素朴なグルメ
                    </p>
                  </div>
                  <ViewMore />
                </motion.div>
                <CardRow cards={GOURMET_CARDS} />
              </motion.section>

              {/* 体験・イベント */}
              <motion.section
                id="event"
                className="flex w-full flex-col gap-[120px]"
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={stagger}
              >
                <motion.div
                  variants={reveal}
                  className="flex w-full items-end justify-between"
                >
                  <div className="flex flex-col items-start gap-[16px]">
                    <img
                      src="/img/bubble-event.svg"
                      alt="気が向いたら、これ"
                      className="w-[287px]"
                    />
                    <p className="text-[48px] font-medium leading-[1.2] text-white">
                      体験・イベント
                    </p>
                  </div>
                  <ViewMore />
                </motion.div>
                <CardRow cards={EVENT_CARDS} />
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
