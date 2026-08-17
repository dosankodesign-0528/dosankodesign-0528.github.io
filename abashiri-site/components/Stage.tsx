"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Bird from "./Bird";
import IllustTamannee from "./IllustTamannee";
import { useFaceReaction } from "./useFaceReaction";
import { DEFAULT_HERO_TIMING, type HeroTiming } from "./heroTiming";
import { DEFAULT_BIRDS, type BirdsConfig } from "./birdConfig";
import { mergeFace, type FaceConfig } from "./faceConfig";
import { mergeLayout, type LayoutTune } from "./layoutConfig";
import { findTamaranee } from "./tamaraneePatterns";

/*
 * 人物イラストのスイング（/mock/illust で5パターン比較）
 * 共通ルール：回転軸はイラストの下辺中央（transformOrigin 50% 100%）、
 * 角度は −4°〜+4° の範囲だけ。その中で緩急（メリハリ）の付け方を変えている。
 * 約15秒に1回。下端の切れ目対策でイラストは28px下げてある（top:72）
 */
import type { Transition } from "framer-motion";

const SWING_STYLE: React.CSSProperties = { transformOrigin: "50% 100%", top: 72 };

type IllustAnim = {
  animate: Record<string, number[]>;
  transition: Transition;
  style: React.CSSProperties;
};

const ILLUST_ANIMS: Record<number, IllustAnim> = {
  /* 案1: タメて→スナップ。左へゆっくり傾いてから右へ一気、弾んで戻る */
  1: {
    animate: { rotate: [0, -4, 4, -1.5, 0.5, 0] },
    transition: {
      duration: 2.2,
      times: [0, 0.35, 0.5, 0.7, 0.85, 1],
      ease: ["easeInOut", "easeIn", "easeOut", "easeOut", "easeOut"],
      repeat: Infinity,
      repeatDelay: 12.8,
    },
    style: SWING_STYLE,
  },
  /* 案2: 速い2往復→ゆっくり収束。出だし全力、あとはふわっと */
  2: {
    animate: { rotate: [0, 4, -4, 4, -2, 0] },
    transition: {
      duration: 2.0,
      times: [0, 0.15, 0.35, 0.55, 0.8, 1],
      ease: ["easeOut", "easeInOut", "easeInOut", "easeOut", "easeInOut"],
      repeat: Infinity,
      repeatDelay: 13,
    },
    style: SWING_STYLE,
  },
  /* 案3: ワイパー。右へじーっくりため → 左へビュッ → ゆっくり中央へ */
  3: {
    animate: { rotate: [0, 4, -4, 0] },
    transition: {
      duration: 2.4,
      times: [0, 0.5, 0.62, 1],
      ease: ["easeInOut", "easeIn", "easeInOut"],
      repeat: Infinity,
      repeatDelay: 12.6,
    },
    style: SWING_STYLE,
  },
  /* 案4【採用】: 小刻みシェイク→ピタッ。右へ傾いてから震えてすっと止まる */
  4: {
    animate: { rotate: [0, 4, -3.5, 3, -2.5, 1.5, 0] },
    transition: {
      duration: 1.6,
      times: [0, 0.12, 0.24, 0.36, 0.5, 0.68, 1],
      ease: ["easeOut", "easeInOut", "easeInOut", "easeInOut", "easeInOut", "easeOut"],
      repeat: Infinity,
      repeatDelay: 13.4,
    },
    style: SWING_STYLE,
  },
  /* 案5: タメ静止つきワンモーション。左でピタッと静止→右へ大きく→中央へ */
  5: {
    animate: { rotate: [0, -4, -4, 4, 0] },
    transition: {
      duration: 2.4,
      times: [0, 0.25, 0.42, 0.64, 1],
      ease: ["easeInOut", "linear", "easeIn", "easeOut"],
      repeat: Infinity,
      repeatDelay: 12.6,
    },
    style: SWING_STYLE,
  },
};

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
  /** true: カモメをドラッグで動かせる（調整パネル用） */
  birdsEditable?: boolean;
  /** ドラッグでカモメが動いた時の通知（調整パネル用） */
  onBirdMove?: (key: "skyTopLeft" | "skyRight", patch: { x: number; y: number }) => void;
  /** 1〜5: 人物イラストのスイングパターン（既定は採用版の案4） */
  illustAnim?: number;
  /** カーソルに反応する眉の動き（faceConfig.ts） */
  face?: Partial<FaceConfig> | null;
  /** 右カラムなどの位置（layoutConfig.ts） */
  layout?: Partial<LayoutTune> | null;
  /** 1〜5: ホバー時に「たまらねー」が出るパターン（tamaraneePatterns.ts） */
  tamaranee?: number | string | null;
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
  birdsEditable = false,
  onBirdMove,
  illustAnim = 4,
  face,
  layout,
  tamaranee,
}: StageProps) {
  const L = mergeLayout(layout);
  const fc = mergeFace(face);
  /* イラストは pointer-events-none のままにしたいので、:hover ではなく
     カーソルの座標を見て自前で判定する（詳細は useFaceReaction.ts） */
  const illustRef = useRef<HTMLDivElement>(null);
  const browLift = useFaceReaction(illustRef, fc);
  /* browLift が 0 より大きい＝カーソルがイラストに乗っている */
  const over = browLift > 0;
  const tp = findTamaranee(tamaranee);
  const ia = ILLUST_ANIMS[illustAnim] ?? ILLUST_ANIMS[4];
  const [fit, setFit] = useState<{ scale: number; stageW: number; top: number } | null>(
    null
  );
  const [illustIn, setIllustIn] = useState(!illustEntrance);
  const [spin, setSpin] = useState(false);

  /* 調整パネル用：カモメをドラッグで動かす */
  const dragBird = (key: "skyTopLeft" | "skyRight") => (e: React.PointerEvent) => {
    if (!birdsEditable || !fit || !onBirdMove) return;
    e.preventDefault();
    e.stopPropagation();
    const start = { px: e.clientX, py: e.clientY, x: birds[key].x, y: birds[key].y };
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.px) / fit.scale;
      const dy = (ev.clientY - start.py) / fit.scale;
      onBirdMove(key, {
        /* skyRight は右端からの距離なので左右反転 */
        x: Math.round(key === "skyRight" ? start.x - dx : start.x + dx),
        y: Math.round(start.y + dy),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

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

  /* TopPage からの合図（一番最後）でイラストを出す。保険で12秒後には必ず出す */
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
        className="absolute left-0 overflow-hidden bg-gradient-to-b from-sky-top to-sky-bottom transition-opacity duration-300"
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
          className={`absolute ${birdsEditable ? "z-40 cursor-move" : ""}`}
          onPointerDown={dragBird("skyTopLeft")}
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
          className={`absolute ${birdsEditable ? "z-40 cursor-move" : ""}`}
          onPointerDown={dragBird("skyRight")}
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

        {/* 人物イラスト（たまんねーっ・キラキラ込み）。常に最前面。
            ブラーで出たあと、一回だけクルンと一回転（軽いバウンスつき）して目立たせる */}
        <motion.div
          /* v1.1 カンプ 15071:24641: イラストは (1244.56, 764) / 162x226.8、
             「たまらねー」は (1380.05, 749.94) / 75.2x53.3。
             元PNG（284x357）は書き出しの縦横比が違うので、
             カンプの絵の高さ 216.4px に合わせて 172x216 に縮めて置いている。 */
          className="pointer-events-none absolute left-[1245px] top-[750px] z-30 h-[241px] w-[210px]"
          initial={
            illustEntrance
              ? { opacity: 0, filter: `blur(${timing.illust.blur}px)` }
              : false
          }
          animate={illustIn ? { opacity: 1, filter: "blur(0px)" } : undefined}
          transition={{
            duration: timing.illust.duration / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={() => {
            if (illustEntrance && illustIn) setSpin(true);
          }}
        >
          <div className="relative h-full w-full">
          {illustration === "tamannee" ? (
            <>
              {/* 人物だけ、15秒に1回クルンと一回転（文字とキラキラは回さない） */}
              <motion.div
                ref={illustRef}
                className="absolute left-0 top-[14px] h-[227px] w-[162px] drop-shadow-illust"
                style={ia.style}
                animate={spin ? ia.animate : undefined}
                transition={spin ? ia.transition : undefined}
              >
                <IllustTamannee lift={browLift} className="size-full" />
              </motion.div>
              {/* キラキラ：GIF風に2箇所をパキッと行き来（フェード無し） */}
              <div className="sparkle-hop absolute left-[6px] top-[58px] w-[17px]">
                <img src="/img/sparkle.svg" alt="" className="w-full" />
              </div>
              {/* v1.1: 「たまらねー」はホバーした時だけ、ひょこっと出る。
                 出方は tamaraneePatterns.ts の5案から選べる（/mock/tamaranee で比較） */}
              <img
                src="/img/text-tamaranee.svg"
                alt="たまらねー"
                className="absolute left-[135px] top-0 h-[53px] w-[75px] will-change-transform"
                style={{
                  transformOrigin: tp.text.origin,
                  transitionProperty: "opacity, transform, filter",
                  transitionDuration: `${tp.text.duration}ms`,
                  transitionTimingFunction: tp.text.ease,
                  transitionDelay: `${over ? tp.text.delay : 0}ms`,
                  ...(over ? tp.text.on : tp.text.off),
                }}
              />
            </>
          ) : (
            <>
              <img
                src="/img/illust-video.png"
                alt=""
                className="absolute left-[-6px] top-[20px] h-[234px] w-[162px] object-cover drop-shadow-illust"
              />
              <img
                src="/img/text-bo.svg"
                alt="ぼーっ"
                className="absolute left-[142px] top-[25px] w-[40px]"
              />
            </>
          )}
          </div>
        </motion.div>

        {/* v1.1: 右レール（縦書き「網走 観光サイト」＋SNS 3つ）はカンプから無くなった。
            サイト名は吹き出しの上の手書き「網走市観光サイト」に置き換わっている。
            アセット（logo-abashiri.svg / sns-*.svg）はフッター用に残してある。 */}
      </div>
    </div>
  );
}
