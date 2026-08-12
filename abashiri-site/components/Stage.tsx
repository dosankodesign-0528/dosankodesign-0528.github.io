"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Bird from "./Bird";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";
import { DEFAULT_BIRDS, type BirdsConfig } from "./birdConfig";

type StageProps = {
  children: React.ReactNode;
  /** tamannee: TOP系（ニヤリ顔＋たまんねーっ） / bo: 動画視聴中（横顔＋ぼーっ） */
  illustration?: "tamannee" | "bo";
  /** true: イラスト（人物＋たまんねーっ＋キラキラ）を演出の一番最後にブラーで出す */
  illustEntrance?: boolean;
  /** イラスト出現の質感（heroTiming.illust） */
  timing?: HeroTiming;
  /** カモメの配置・見た目（birdConfig.ts） */
  birds?: BirdsConfig;
};

/**
 * デザインカンプの 1512x982 ステージを画面サイズに合わせて等倍縮小して中央表示する。
 * 空・カモメ・人物イラスト・右レール（ロゴ/SNS）は全ページ共通。
 */
export default function Stage({
  children,
  illustration = "tamannee",
  illustEntrance = false,
  timing = DEFAULT_HERO_TIMING,
  birds = DEFAULT_BIRDS,
}: StageProps) {
  const [fit, setFit] = useState<{ scale: number; stageW: number; top: number } | null>(
    null
  );
  const [illustIn, setIllustIn] = useState(!illustEntrance);

  /* 高さ基準でスケールし、横は画面幅いっぱいまでステージを広げる
     （モックデバイス側が可変幅で伸びる） */
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vh / 982, vw / 1512);
      const stageW = Math.max(1512, vw / scale);
      const top = Math.max(0, (vh - 982 * scale) / 2);
      setFit({ scale, stageW, top });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* TopMock からの合図（一番最後）でイラストを出す。保険で12秒後には必ず出す */
  useEffect(() => {
    if (!illustEntrance) return;
    const show = () => setIllustIn(true);
    window.addEventListener("abashiri:illust-in", show);
    const fallback = window.setTimeout(show, 12000);
    return () => {
      window.removeEventListener("abashiri:illust-in", show);
      window.clearTimeout(fallback);
    };
  }, [illustEntrance]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute left-0 overflow-hidden bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] transition-opacity duration-300"
        style={{
          width: fit?.stageW ?? 1512,
          height: 982,
          top: fit?.top ?? 0,
          transform: `scale(${fit?.scale ?? 1})`,
          transformOrigin: "top left",
          opacity: fit ? 1 : 0,
        }}
      >
        {/* 空のカモメ（左上・右中）。位置や線幅は birdConfig で調整できる */}
        <div
          className="absolute"
          style={{
            left: birds.skyTopLeft.x,
            top: birds.skyTopLeft.y,
            width: birds.skyTopLeft.w,
            height: birds.skyTopLeft.w * 0.58,
            transform: `rotate(${birds.skyTopLeft.rotate}deg)`,
          }}
        >
          <Bird
            flapDuration={birds.skyTopLeft.flap}
            driftDuration={birds.skyTopLeft.drift}
            delay={birds.skyTopLeft.delay}
            strokeWidth={birds.skyTopLeft.stroke}
          />
        </div>
        <div
          className="absolute"
          style={{
            right: birds.skyRight.x,
            top: birds.skyRight.y,
            width: birds.skyRight.w,
            height: birds.skyRight.w * 0.58,
            transform: `rotate(${birds.skyRight.rotate}deg)`,
          }}
        >
          <Bird
            flapDuration={birds.skyRight.flap}
            driftDuration={birds.skyRight.drift}
            delay={birds.skyRight.delay}
            strokeWidth={birds.skyRight.stroke}
          />
        </div>

        {children}

        {/* 人物イラスト（たまんねーっ・キラキラ込み）。常に最前面に置く */}
        <motion.div
          className="pointer-events-none absolute right-0 top-[600px] z-30 h-[401px] w-[366px] overflow-clip"
          initial={
            illustEntrance
              ? { opacity: 0, filter: `blur(${timing.illust.blur}px)` }
              : false
          }
          animate={illustIn ? { opacity: 1, filter: "blur(0px)" } : undefined}
          transition={{
            duration: timing.illust.duration / 1000,
            ease: [0.33, 1, 0.68, 1],
          }}
        >
          {illustration === "tamannee" ? (
            <>
              <img
                src="/img/illust-main.png"
                alt=""
                className="absolute left-[1px] top-[44px] h-[357px] w-[284px] object-cover [filter:drop-shadow(-8px_1px_2px_rgba(0,0,0,0.15))]"
              />
              {/* キラキラ：GIF風に2箇所をパキッと行き来（フェード無し） */}
              <div className="sparkle-hop absolute left-[14px] top-[116px] w-[30px]">
                <img src="/img/sparkle.svg" alt="" className="w-full" />
              </div>
              <img
                src="/img/text-tamannee.svg"
                alt="たまんねーっ"
                className="absolute left-[213px] top-[29px] w-[127px]"
              />
            </>
          ) : (
            <>
              <img
                src="/img/illust-video.png"
                alt=""
                className="absolute left-[-9px] top-[34px] h-[387px] w-[268px] object-cover [filter:drop-shadow(-8px_1px_2px_rgba(0,0,0,0.25))]"
              />
              <img
                src="/img/text-bo.svg"
                alt="ぼーっ"
                className="absolute left-[246px] top-[42px] w-[65px]"
              />
            </>
          )}
        </motion.div>

        {/* 右レール：ロゴ・SNS */}
        <div className="absolute right-[68px] top-[69px] flex flex-col items-center gap-[63px]">
          <Link href="/" aria-label="ホームへ戻る" className="transition-opacity hover:opacity-70">
            <img src="/img/logo-abashiri.svg" alt="網走" className="h-[164px] w-[62px]" />
          </Link>
          <div className="flex flex-col gap-[14px]">
            <a href="#" aria-label="Instagram" className="relative block size-[44px] transition-transform hover:scale-110">
              <img src="/img/sns-ig-frame.svg" alt="" className="absolute inset-0 size-full" />
              <img src="/img/sns-ig-circle.svg" alt="" className="absolute inset-[24.32%]" />
              <img src="/img/sns-ig-dot.svg" alt="" className="absolute right-[17.3%] top-[17.3%] size-[12%]" />
            </a>
            <a href="#" aria-label="X" className="flex size-[44px] items-center justify-center transition-transform hover:scale-110">
              <img src="/img/sns-x.svg" alt="" className="w-[40px]" />
            </a>
            <a href="#" aria-label="YouTube" className="flex size-[44px] items-center justify-center transition-transform hover:scale-110">
              <img src="/img/sns-yt.svg" alt="" className="w-[44px]" />
            </a>
          </div>
        </div>

        {/* 縦書き「観光サイト」 */}
        <p className="absolute right-[36px] top-[69px] text-center text-[16px] font-black leading-[1.3] tracking-[2px] text-white [writing-mode:vertical-rl]">
          観光サイト
        </p>
      </div>
    </div>
  );
}
