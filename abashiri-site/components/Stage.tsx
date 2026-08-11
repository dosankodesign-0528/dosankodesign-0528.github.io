"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import Bird from "./Bird";

type StageProps = {
  children: React.ReactNode;
  /** tamannee: TOP系（ニヤリ顔＋たまんねーっ） / bo: 動画視聴中（横顔＋ぼーっ） */
  illustration?: "tamannee" | "bo";
};

/**
 * デザインカンプの 1512x982 ステージを画面サイズに合わせて等倍縮小して中央表示する。
 * 空・カモメ・人物イラスト・右レール（ロゴ/SNS）は全ページ共通。
 */
export default function Stage({ children, illustration = "tamannee" }: StageProps) {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / 1512, window.innerHeight / 982));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] transition-opacity duration-300"
        style={{
          width: 1512,
          height: 982,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          opacity: scale ? 1 : 0,
        }}
      >
        {/* 空のカモメ（左上・右中） */}
        <div className="absolute left-[22px] top-[30px] h-[36px] w-[51px] -rotate-[19deg]">
          <Bird src="/img/bird-sky-2.svg" flapDuration={0.55} driftDuration={7} />
        </div>
        <div className="absolute right-[-40px] top-[570px] h-[70px] w-[105px]">
          <Bird src="/img/bird-sky-1.svg" flapDuration={0.7} driftDuration={9} delay={1.2} />
        </div>

        {children}

        {/* 人物イラスト */}
        <div className="pointer-events-none absolute left-[1146px] top-[600px] h-[401px] w-[366px] overflow-clip">
          {illustration === "tamannee" ? (
            <>
              <img
                src="/img/illust-main.png"
                alt=""
                className="absolute left-[1px] top-[44px] h-[357px] w-[284px] object-cover [filter:drop-shadow(-8px_1px_2px_rgba(0,0,0,0.15))]"
              />
              <img
                src="/img/sparkle.svg"
                alt=""
                className="absolute left-[14px] top-[116px] w-[30px]"
              />
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
        </div>

        {/* 右レール：ロゴ・SNS */}
        <div className="absolute left-[1382px] top-[69px] flex flex-col items-center gap-[63px]">
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
        <p className="absolute left-[1460px] top-[69px] text-center text-[16px] font-black leading-[1.3] tracking-[2px] text-white [writing-mode:vertical-rl]">
          観光サイト
        </p>
      </div>
    </div>
  );
}
