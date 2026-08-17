"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * ぼーっと体験（v1.1）
 * カンプ: 15152:27989（導入）/ 15152:29215（場所えらび）/ 15152:29191（ホバー）
 *         15152:29237（遷移後）/ 15152:29261（動画再生）
 *
 * 3ステップ
 *   1 導入      … 全画面のぼやけた景色 ＋ 中央のテキスト ＋「次へ進む」
 *   2 場所えらび … 右から左へゆっくり流れるカルーセル。ホバーで拡大＋動画プレビュー
 *   3 動画再生   … 全画面の動画 ＋ 左下のぼーっとタイマー
 *
 * 2→3 の間に「窓枠をくぐって向こう側の世界に入る」遷移が挟まる（enterPatterns.ts の5案）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlobalNav from "./GlobalNav";
import { devSilent } from "./devSound";
import { findEnter } from "./enterPatterns";

export type Step = 1 | 2 | 3;

/* カンプ 15152:29215 のカルーセル。
   ⚠️ 3枚目の「駅のホーム」の写真はカンプにしか無く、この環境から取得できなかったため
   既存の天都山展望台で仮置きしている。差し替え待ち。
   ⚠️ 動画も ryuhyo.mp4 の1本しか無いので、プレビューは全カード同じものを流している。 */
export type Spot = {
  id: string;
  label: string;
  src: string;
  video: string;
  /** カンプに無く仮置きしている素材かどうか（報告用） */
  placeholder?: boolean;
};

const SPOTS: Spot[] = [
  { id: "sango", label: "さんご草", src: "/img/scene-sango.jpg", video: "/video/ryuhyo.mp4" },
  { id: "ryuhyo", label: "流氷クルーズ", src: "/img/scene-ryuhyo.jpg", video: "/video/ryuhyo.mp4" },
  { id: "tento", label: "天都山展望台", src: "/img/scene-tento.jpg", video: "/video/ryuhyo.mp4", placeholder: true },
  { id: "himawari", label: "ひまわり畑", src: "/img/scene-himawari.jpg", video: "/video/ryuhyo.mp4" },
];

/* カンプ 15152:29215 の実寸 */
const CARD_W = 902;
const CARD_H = 586;
const CARD_GAP = 60;
/* ホバー時（15152:29191）は 1160x754 に広がる */
const HOVER_SCALE = 1160 / CARD_W; /* = 1.2860… 高さも 754/586 = 1.2866 でほぼ同じ */
/* 1周にかける秒数。ゆっくり流す */
const LOOP_SEC = 48;

/* ═══════════ 導入 ═══════════ */
function Intro({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="intro"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* カンプは「最初はブラーなしで景色が出て、徐々にブラーがかかって文字が出る」。
          背景は2枚重ね（奥 blur42 / 手前 blur32）。
          ⚠️ カンプの緑の道の写真は取得できなかったので、既存のひまわり畑で仮置き。 */}
      <motion.img
        src="/img/scene-himawari.jpg"
        alt=""
        className="absolute inset-0 size-full scale-110 object-cover"
        initial={{ filter: "blur(0px)" }}
        animate={{ filter: "blur(42px)" }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-brand/85 via-brand/45 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
      />

      {/* カンプ 15152:29260: (565, 110) 382x629 / 縦並び gap 100 */}
      <motion.div
        className="absolute left-1/2 top-[110px] flex w-[382px] -translate-x-1/2 flex-col items-center gap-[100px] text-center text-white"
        initial={{ opacity: 0, filter: "blur(16px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 1.6 }}
      >
        <div className="flex w-full flex-col items-center gap-[77px]">
          <div className="flex flex-col items-center leading-[1.6] whitespace-nowrap">
            <p className="text-body-18 font-light">網走に来る前に、まずやってみよう</p>
            <p className="text-title-44 font-thin">ぼーっと体験</p>
          </div>
          <div className="flex w-full flex-col items-center gap-[33px] text-body-16 font-light leading-[1.8]">
            <p>網走は何もないけど、それがたまらない。</p>
            <p>
              忙しなく過ごす、あなたの日常からそっと離れて、
              <br />
              何も考えず、「ぼーっとする」こと。
            </p>
            <p className="whitespace-nowrap">
              それが最大の癒しであり、くつろぎです。
              <br />
              網走では、そんな体験が思う存分できる。
            </p>
            <p className="whitespace-nowrap">
              ウェブサイトを通して、その空間を
              <br />
              疑似体験しよう。
            </p>
          </div>
        </div>
        <GlassButton onClick={onNext}>次へ進む</GlassButton>
      </motion.div>
    </motion.div>
  );
}

/* カンプ 15152:28007 / 15152:29231 共通のすりガラスボタン */
function GlassButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[220px] cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white/10 px-11 py-4 text-body-16 font-medium leading-[1.2] text-white backdrop-blur-65 transition-transform hover:scale-105"
    >
      {children}
    </button>
  );
}

/* ═══════════ 場所えらび（自動カルーセル） ═══════════ */
function Pick({
  onPick,
}: {
  onPick: (spot: Spot, rect: DOMRect) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  /* 同じ並びを2周ぶん置いて、-50% までスクロールしたら先頭に戻す＝無限に流れて見える */
  const loop = [...SPOTS, ...SPOTS];

  return (
    <motion.div
      key="pick"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 背景：奥にぼかした景色（カンプ 15152:29216 blur42 / 29217 blur32） */}
      <img
        src="/img/scene-himawari.jpg"
        alt=""
        className="absolute inset-0 size-full scale-110 object-cover blur-42"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand/85 via-brand/40 to-transparent" />

      <p className="absolute left-1/2 top-[110px] -translate-x-1/2 whitespace-nowrap text-title-44 font-thin leading-[1.6] text-white">
        どこでぼーっとする？
      </p>

      {/* カンプ 15152:29228: top 239 / gap 60 / カード 902x586 */}
      <div className="absolute left-0 top-[239px] w-full overflow-hidden">
        <div
          className="flex w-max items-center"
          style={{
            gap: CARD_GAP,
            animation: `botto-marquee ${LOOP_SEC}s linear infinite`,
            animationPlayState: hovered ? "paused" : "running",
          }}
        >
          {loop.map((s, i) => (
            <SpotCard
              key={`${s.id}-${i}`}
              spot={s}
              active={hovered === `${s.id}-${i}`}
              onEnter={() => setHovered(`${s.id}-${i}`)}
              onLeave={() => setHovered(null)}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SpotCard({
  spot,
  active,
  onEnter,
  onLeave,
  onPick,
}: {
  spot: Spot;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onPick: (spot: Spot, rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ホバーしている間だけ動画プレビューを流す */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.muted = true; /* プレビューは常に無音。音は動画再生画面から */
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  return (
    <div
      ref={ref}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className="relative shrink-0 overflow-hidden border-white/60 transition-transform duration-700 ease-standard"
      style={{
        width: CARD_W,
        height: CARD_H,
        borderWidth: 10,
        borderRadius: 120,
        transform: `scale(${active ? HOVER_SCALE : 1})`,
        zIndex: active ? 10 : 1,
      }}
    >
      <img src={spot.src} alt={spot.label} className="absolute inset-0 size-full object-cover" />
      <video
        ref={videoRef}
        src={spot.video}
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ease-standard ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* カンプ 15152:29231: カード内 top 464 に「この場所にする」 */}
      <div
        className={`absolute left-1/2 top-[464px] -translate-x-1/2 transition-opacity duration-500 ease-standard ${
          active ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <GlassButton
          onClick={() => {
            const r = ref.current?.getBoundingClientRect();
            if (r) onPick(spot, r);
          }}
        >
          この場所にする
        </GlassButton>
      </div>
    </div>
  );
}

/* ═══════════ 動画再生 ═══════════ */
function Watch({ spot }: { spot: Spot }) {
  const [remaining, setRemaining] = useState(3 * 60);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = devSilent();
    v.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  /* 動画の音声が優先：再生状態を環境音（SoundUi）へ知らせる */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abashiri:video-audio", { detail: { active: true } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("abashiri:video-audio", { detail: { active: false } })
      );
    };
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <motion.div
      key="watch"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <video
        ref={videoRef}
        src={spot.video}
        loop
        playsInline
        className="absolute inset-0 size-full object-cover"
      />
      {/* カンプ 15152:29287: 左67 / 下から（top 768）/ 地 white/10 / blur65 / 角丸16 / 左右44・上下24 */}
      <div className="absolute left-[67px] top-[768px] flex flex-col items-start justify-center gap-6 rounded-16 bg-white/10 px-11 py-6 backdrop-blur-65">
        {/* ラベルの札はパネルの上辺にまたがる（カンプ: left 122.5 / top -22） */}
        <div className="absolute left-[122.5px] top-[-22px] flex items-center justify-center rounded-full bg-white/40 px-4 py-1.5 backdrop-blur-90">
          <p className="whitespace-nowrap text-body-16 font-normal leading-[1.2] text-white">
            ぼーっとタイマー
          </p>
        </div>
        <p className="font-num whitespace-nowrap text-number-120 font-thin leading-none text-white">
          {mm}:{ss}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════ 窓枠をくぐる遷移 ═══════════ */
function EnterWindow({
  spot,
  from,
  pattern,
  onDone,
}: {
  spot: Spot;
  from: DOMRect;
  pattern: number | string | null | undefined;
  onDone: () => void;
}) {
  const p = findEnter(pattern);
  useEffect(() => {
    const id = setTimeout(onDone, p.duration);
    return () => clearTimeout(id);
  }, [onDone, p.duration]);

  return (
    <motion.div className="absolute inset-0 z-50" key="enter">
      {/* まわりを暗く落とす（トンネル感） */}
      <motion.div
        className="absolute inset-0 bg-shadow"
        initial={{ opacity: 0 }}
        animate={{ opacity: p.dim }}
        transition={{ duration: p.duration / 1000, ease: p.ease }}
      />
      {/* 選んだカードが窓枠。近づくにつれて角丸とフチが外れ、画面いっぱいになる */}
      <motion.div
        className="absolute overflow-hidden border-white/60"
        style={{ left: from.left, top: from.top, width: from.width, height: from.height }}
        initial={{
          scale: p.scale[0],
          borderRadius: p.radius[0],
          borderWidth: p.border[0],
          filter: `blur(${p.blur[0]}px)`,
        }}
        animate={{
          scale: p.scale[1],
          borderRadius: p.radius[1],
          borderWidth: p.border[1],
          filter: [
            `blur(${p.blur[0]}px)`,
            `blur(${p.blur[1]}px)`,
            `blur(${p.blur[2]}px)`,
          ],
        }}
        transition={{ duration: p.duration / 1000, ease: p.ease }}
      >
        <img src={spot.src} alt="" className="absolute inset-0 size-full object-cover" />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════ 本体 ═══════════ */
export default function ExperienceFlow({
  step,
  setStep,
  enter,
}: {
  step: Step;
  setStep: (s: Step) => void;
  /** 1〜5: 窓枠をくぐる遷移のパターン（enterPatterns.ts） */
  enter?: number | string | null;
}) {
  const [spot, setSpot] = useState<Spot>(SPOTS[1]);
  const [entering, setEntering] = useState<DOMRect | null>(null);

  const handlePick = useCallback((s: Spot, rect: DOMRect) => {
    setSpot(s);
    setEntering(rect);
  }, []);

  const finishEnter = useCallback(() => {
    setEntering(null);
    setStep(3);
  }, [setStep]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* サウンドON/OFFの置き場：SoundUi がここへ描画する */}
      <div id="abashiri-sound-slot" className="absolute left-[32px] top-[32px] z-40" />

      <AnimatePresence mode="wait">
        {step === 1 && <Intro key="intro" onNext={() => setStep(2)} />}
        {step === 2 && !entering && <Pick key="pick" onPick={handlePick} />}
        {step === 3 && <Watch key="watch" spot={spot} />}
      </AnimatePresence>

      {entering && (
        <EnterWindow spot={spot} from={entering} pattern={enter} onDone={finishEnter} />
      )}

      <GlobalNav theme="light" />
    </div>
  );
}
