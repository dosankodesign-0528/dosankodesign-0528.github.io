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
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type Variants,
} from "framer-motion";
import GlobalNav from "./GlobalNav";
import { devSilent } from "./devSound";
import { findEnter } from "./enterPatterns";
import { findCarousel } from "./carouselPatterns";

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

/* ぼーっと体験の背景写真（カンプ 15152:27990 / 29216）。
   海へ向かう一本道に灯台。まだ public/img に置かれていない間は、
   壊れた画像にならないよう既存写真へ自動で退避する。 */
const BG_ROAD = "/img/botto-road.jpg";
const BG_FALLBACK = "/img/scene-himawari.jpg";
const bgFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  if (!el.src.endsWith(BG_FALLBACK)) el.src = BG_FALLBACK;
};

const STAGE_W = 1512;
const STAGE_H = 982;

/* カンプ 15152:29215 の実寸 */
const CARD_W = 902;
const CARD_H = 586;
const CARD_GAP = 60;
/* ホバー時（15152:29191）は 1160x754 に広がる */
const HOVER_SCALE = 1160 / CARD_W; /* = 1.2860… 高さも 754/586 = 1.2866 でほぼ同じ */
/* 1周にかける秒数。ゆっくり流す */
const LOOP_SEC = 48;

/* 導入の文字は、上から順に1ブロックずつブラーが晴れて出てくる。
   景色のブラーが掛かり終わる（0.8+2.2秒）のを待ってから始める */
const INTRO_STAGGER: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 1.5, staggerChildren: 0.55 } },
};
const INTRO_BLOCK: Variants = {
  hidden: { opacity: 0, filter: "blur(16px)", y: 14 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
};

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
        src={BG_ROAD}
        onError={bgFallback}
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

      {/* カンプ 15152:29260: (565, 110) 382x629 / 縦並び gap 100。
          文字は一気に出さず、上から順に1ブロックずつブラーが晴れて出てくる。
          ぼーっと読ませたいので、間隔は広め（0.55秒おき）に取っている */}
      <motion.div
        /* 上下中央ぞろえ。カンプは top 110px 固定だが、文字量で高さが変わるので
           画面の真ん中に置いたほうが収まりが良い */
        className="absolute left-1/2 top-1/2 flex w-[382px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[100px] text-center text-white"
        variants={INTRO_STAGGER}
        initial="hidden"
        animate="show"
      >
        <div className="flex w-full flex-col items-center gap-[77px]">
          <motion.div
            variants={INTRO_BLOCK}
            className="flex flex-col items-center leading-[1.6] whitespace-nowrap"
          >
            <p className="text-body-18 font-light">網走に来る前に、まずやってみよう</p>
            <p className="text-title-44 font-thin">ぼーっと体験</p>
          </motion.div>
          <div className="flex w-full flex-col items-center gap-[33px] text-body-16 font-light leading-[1.8]">
            <motion.p variants={INTRO_BLOCK}>網走は何もないけど、それがたまらない。</motion.p>
            <motion.p variants={INTRO_BLOCK}>
              忙しなく過ごす、あなたの日常からそっと離れて、
              <br />
              何も考えず、「ぼーっとする」こと。
            </motion.p>
            <motion.p variants={INTRO_BLOCK} className="whitespace-nowrap">
              それが最大の癒しであり、くつろぎです。
              <br />
              網走では、そんな体験が思う存分できる。
            </motion.p>
            <motion.p variants={INTRO_BLOCK} className="whitespace-nowrap">
              ウェブサイトを通して、その空間を
              <br />
              疑似体験しよう。
            </motion.p>
          </div>
        </div>
        <motion.div variants={INTRO_BLOCK}>
          <GlassButton onClick={onNext}>次へ進む</GlassButton>
        </motion.div>
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

/* ═══════════ 場所えらび（中央固定のカルーセル） ═══════════ */
/*
 * 選べるのは中央に来たカードだけ。中央のカードだけが拡大して
 * 「この場所にする」が出る。左右のカードにはボタンを出さない。
 *
 * こうすると、窓に入る遷移が「中央から真っ直ぐ膨らむ」だけになる。
 * 横に滑りながら膨らむと『部品が飛んできた』に見えて、近づいている感じが出ない。
 */
const STEP = CARD_W + CARD_GAP; /* カード1枚ぶんの送り幅 */

function Pick({
  onPick,
  pattern,
}: {
  onPick: (spot: Spot, rect: DOMRect) => void;
  pattern?: number | string | null;
}) {
  const pat = findCarousel(pattern);
  const [index, setIndex] = useState(0);
  /* 自動送り。止まる案は「見せる時間＋滑る時間」、流れ続ける案は滑る時間だけ */
  useEffect(() => {
    const wait = pat.continuous ? pat.slide : pat.dwell + pat.slide;
    const id = setInterval(() => setIndex((i) => i + 1), wait);
    return () => clearInterval(id);
  }, [pat]);

  const active = ((index % SPOTS.length) + SPOTS.length) % SPOTS.length;
  /* 中央のカードの左端が (1512 - 902) / 2 に来るように track をずらす */
  const trackX = (STAGE_W - CARD_W) / 2 - index * STEP;
  /* 前後2枚ずつだけ描く。index は増え続けるが、中身は循環させるので無限に流れる */
  const slots = [-2, -1, 0, 1, 2].map((d) => {
    const pos = index + d;
    return { pos, spot: SPOTS[((pos % SPOTS.length) + SPOTS.length) % SPOTS.length] };
  });

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
        src={BG_ROAD}
        onError={bgFallback}
        alt=""
        className="absolute inset-0 size-full scale-110 object-cover blur-42"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand/85 via-brand/40 to-transparent" />

      <p className="absolute left-1/2 top-[110px] -translate-x-1/2 whitespace-nowrap text-title-44 font-thin leading-[1.6] text-white">
        どこでぼーっとする？
      </p>

      {/* ホバーで 1160x754 に広がる（15152:29191）ので、器はその高さぶん確保しておく。
          中心ぞろえにすると通常時の上端がカンプどおり 239px に来る（155 + (754-586)/2）。 */}
      <div className="absolute left-0 top-[155px] h-[754px] w-full overflow-hidden">
        <motion.div
          className="relative h-full"
          animate={{ x: trackX }}
          transition={{ duration: pat.slide / 1000, ease: pat.ease }}
        >
          {slots.map(({ pos, spot }) => (
            <SpotCard
              key={pos}
              spot={spot}
              /* いま中央に来ている1枚だけを有効にする */
              active={pos === index}
              left={pos * STEP}
              onPick={onPick}
            />
          ))}
        </motion.div>
      </div>

      {/* いま何枚目か。中央固定にすると位置の手がかりが要る */}
      <div className="absolute bottom-[42px] left-1/2 flex -translate-x-1/2 items-center gap-3">
        {SPOTS.map((s, i) => (
          <span
            key={s.id}
            className={`block size-[8px] rounded-full transition-all duration-500 ease-standard ${
              i === active ? "w-[26px] bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function SpotCard({
  spot,
  active,
  left,
  onPick,
}: {
  spot: Spot;
  /** 中央に来ているか。true の時だけ拡大してボタンが出る */
  active: boolean;
  /** track の中での左端の位置(px) */
  left: number;
  onPick: (spot: Spot, rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* 中央にいる間だけ動画プレビューを流す */
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
      className="absolute top-1/2 overflow-hidden border-white/60 transition-all duration-700 ease-standard"
      style={{
        left,
        marginTop: -CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        borderWidth: 10,
        borderRadius: 120,
        transform: `scale(${active ? HOVER_SCALE : 1})`,
        /* 中央以外は少し引いて見せて、選べるのが中央だけだと分かるようにする */
        opacity: active ? 1 : 0.55,
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
        /* 見せるだけの飾りなので、クリックは全部すり抜けさせる */
        className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-700 ease-standard ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* カンプ 15152:29231: カード内 top 464。中央のカードにだけ出す */}
      <div
        className={`absolute left-1/2 top-[464px] z-10 -translate-x-1/2 transition-all duration-500 ease-standard ${
          active
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
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
/* v1.0 と同じ挙動：最初は止まっていて、再生ボタンを押すと動画とタイマーが同時に始まる。
   再生中は3秒さわらないと操作系が消えて、動かすとまた出てくる。 */
function Watch({ spot }: { spot: Spot }) {
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(3 * 60);
  const [uiVisible, setUiVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 再生中だけ、3秒放置で操作系を隠す */
  const pokeUi = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 3000);
  }, []);
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );
  const controlsShown = uiVisible || !playing;

  /* playing の状態と <video> の再生を同期する */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.muted = devSilent(); /* 開発中(localhost)は無音 */
      v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing]);

  /* 動画が始まったらぼーっとタイマーがカウントダウン */
  useEffect(() => {
    if (!playing || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [playing, remaining]);

  /* 動画の音声が優先：再生状態を環境音（SoundUi）へ知らせる */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abashiri:video-audio", { detail: { active: playing } })
    );
  }, [playing]);
  useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent("abashiri:video-audio", { detail: { active: false } })
      );
    },
    []
  );

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <motion.div
      key="watch"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={() => playing && pokeUi()}
    >
      <video
        ref={videoRef}
        src={spot.video}
        loop
        playsInline
        className="absolute inset-0 size-full object-cover"
      />

      {/* 再生／一時停止。最初は止まっているので、押して始める */}
      <button
        type="button"
        onClick={() => {
          setPlaying((v) => !v);
          pokeUi();
        }}
        aria-label={playing ? "一時停止" : "再生"}
        className={`absolute left-1/2 top-1/2 z-10 flex size-[96px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-all duration-500 ease-standard hover:scale-110 ${
          controlsShown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <img
          src={playing ? "/img/icon-pause.svg" : "/img/play-circle.svg"}
          alt=""
          className="size-full"
        />
      </button>

      {/* カンプ 15152:29287: 左67 / top 768 / 地 white/10 / blur65 / 角丸16 / 左右44・上下24 */}
      <div
        className={`absolute left-[67px] top-[768px] flex flex-col items-start justify-center gap-6 rounded-16 bg-white/10 px-11 py-6 backdrop-blur-65 transition-opacity duration-500 ease-standard ${
          controlsShown ? "opacity-100" : "opacity-0"
        }`}
      >
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
/*
 * 「窓に近づいていく」を成立させる肝は、窓枠と、窓の向こうの景色を切り離すこと。
 *
 * 前の実装は、写真ごとカードを scale で拡大していた。これは物理的には
 * 「写真を引き伸ばしている」動きで、「窓に近づいている」動きではない。
 * 近づいた時に大きくなるのは“枠”であって、遠くにある景色はほとんど大きくならない。
 * ここがずれていたので不自然に見えていた。
 *
 * 直したところ
 *  1. 景色は画面に固定して一切動かさない。広がるのは窓の“開口部”だけ（＝覗き穴が広がる）
 *  2. 開口部は画面の中心へ寄りながら広がる。カード自身の中心ではなく、目線の先へ向かう
 *  3. イージングを ease-in 寄りに。等速で歩いて近づくと、見た目の大きさは加速して増える
 *  4. まわりの世界（カルーセル・見出し・背景）は外へ押し出して奥に流す
 *  5. 人物イラストは Stage 側の一番上のレイヤーに残るので、窓が人物の手前ではなく
 *     奥から迫ってきて、人物ごと世界に入っていくように見える（z-20 で人物 z-30 の下）
 */

function EnterWindow({
  spot,
  from,
  pattern,
  onDone,
}: {
  spot: Spot;
  /** ステージ座標での、押した瞬間のカードの位置と大きさ */
  from: { x: number; y: number; w: number; h: number };
  pattern: number | string | null | undefined;
  onDone: () => void;
}) {
  const p = findEnter(pattern);
  const sec = p.duration / 1000;

  useEffect(() => {
    const id = setTimeout(onDone, p.duration);
    return () => clearTimeout(id);
  }, [onDone, p.duration]);

  /* 開口部の左上と大きさ。最後は画面より一回り大きくして、フチが見えないところまで開く */
  const overshoot = 1.12;
  const toW = STAGE_W * overshoot;
  const toH = STAGE_H * overshoot;
  const toX = (STAGE_W - toW) / 2;
  const toY = (STAGE_H - toH) / 2;

  /* 開口部の動き。この値を写真側の打ち消しにも使う */
  const x = useMotionValue(from.x);
  const y = useMotionValue(from.y);
  /* 景色は画面に貼り付いたままなので、開口部が動いたぶんだけ中で逆に動かす */
  const imgX = useTransform(x, (v) => -v);
  const imgY = useTransform(y, (v) => -v);

  return (
    <motion.div className="absolute inset-0 z-20 overflow-hidden" key="enter">
      {/* まわりを暗く落とす（トンネル感） */}
      <motion.div
        className="absolute inset-0 bg-shadow"
        initial={{ opacity: 0 }}
        animate={{ opacity: p.dim }}
        transition={{ duration: sec, ease: p.ease }}
      />

      {/* 窓の開口部。枠だけが近づいて広がる。
          出た瞬間だけ 140ms でフェードインして、カードとの見え方の差を吸収する */}
      <motion.div
        className="absolute overflow-hidden border-white/60 [animation:botto-fade-in_140ms_linear]"
        style={{ x, y, width: from.w, height: from.h }}
        initial={{
          x: from.x,
          y: from.y,
          width: from.w,
          height: from.h,
          borderRadius: p.radius[0],
          borderWidth: p.border[0],
        }}
        animate={{
          x: toX,
          y: toY,
          width: toW,
          height: toH,
          borderRadius: p.radius[1],
          borderWidth: p.border[1],
        }}
        transition={{
          duration: sec,
          /* 歩いて近づくと見た目の大きさは加速して増える。
             寸法は ease-in 寄り、位置だけ ease-out 寄りにすると、
             「まっすぐ吸い込まれる」感じになる */
          ease: [0.55, 0, 0.85, 0.6],
          x: { duration: sec, ease: p.ease },
          y: { duration: sec, ease: p.ease },
          borderRadius: { duration: sec * 0.75, ease: p.ease },
          borderWidth: { duration: sec * 0.55, ease: p.ease },
        }}
      >
        {/* 窓の向こうの景色。開口部が動いたぶんだけ逆に動かして、画面上の位置を保つ。
            そのうえで、景色そのものは“わずかに”しか大きくならない（1.18→1.0 の視差）。
            枠が 2.6倍に広がるのに対して景色はほぼ動かない＝この差が奥行きになる。
            景色まで同じ倍率で拡大すると「写真を引き伸ばした」動きになって不自然になる。 */}
        <motion.div
          className="absolute"
          style={{ x: imgX, y: imgY, width: STAGE_W, height: STAGE_H, left: 0, top: 0 }}
        >
          <motion.img
            src={spot.src}
            alt=""
            className="size-full max-w-none object-cover"
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: sec, ease: [0.33, 0, 0.5, 1] }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* まわりの世界（カルーセル・見出し・背景）を外へ押し出して奥に流す */
function WorldPush({
  children,
  active,
  pattern,
}: {
  children: React.ReactNode;
  active: boolean;
  pattern: number | string | null | undefined;
}) {
  const p = findEnter(pattern);
  return (
    <motion.div
      className="absolute inset-0"
      animate={
        active
          ? { scale: 1.35, opacity: 0, filter: "blur(12px)" }
          : { scale: 1, opacity: 1, filter: "blur(0px)" }
      }
      transition={{ duration: p.duration / 1000, ease: [0.55, 0, 0.85, 0.6] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════ 本体 ═══════════ */
export default function ExperienceFlow({
  step,
  setStep,
  enter,
  carousel,
}: {
  step: Step;
  setStep: (s: Step) => void;
  /** 1〜5: 窓枠をくぐる遷移のパターン（enterPatterns.ts） */
  enter?: number | string | null;
  /** 1〜3: カルーセルの動き方（carouselPatterns.ts） */
  carousel?: number | string | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<Spot>(SPOTS[1]);
  const [entering, setEntering] =
    useState<{ x: number; y: number; w: number; h: number } | null>(null);

  /* ブラウザ座標 → ステージ座標（1512x982）に直してから渡す。
     ステージは画面サイズに合わせて縮小表示されているので、その倍率で割る */
  const handlePick = useCallback((s: Spot, rect: DOMRect) => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const scale = rr.width / root.offsetWidth || 1;
    setSpot(s);
    setEntering({
      x: (rect.left - rr.left) / scale,
      y: (rect.top - rr.top) / scale,
      w: rect.width / scale,
      h: rect.height / scale,
    });
  }, []);

  const finishEnter = useCallback(() => {
    setEntering(null);
    setStep(3);
  }, [setStep]);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden">
      {/* サウンドON/OFFの置き場：SoundUi がここへ描画する */}
      <div id="abashiri-sound-slot" className="absolute left-[32px] top-[32px] z-40" />

      {/* 遷移中は、まわりの世界だけ外へ押し出して奥へ流す */}
      <WorldPush active={!!entering} pattern={enter}>
        <AnimatePresence mode="wait">
          {step === 1 && <Intro key="intro" onNext={() => setStep(2)} />}
          {step === 2 && <Pick key="pick" onPick={handlePick} pattern={carousel} />}
          {step === 3 && <Watch key="watch" spot={spot} />}
        </AnimatePresence>
      </WorldPush>

      {entering && (
        <EnterWindow spot={spot} from={entering} pattern={enter} onDone={finishEnter} />
      )}

      <GlobalNav theme="light" />
    </div>
  );
}
