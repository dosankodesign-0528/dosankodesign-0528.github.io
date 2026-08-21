"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * ぼーっとスポット（v1.2 / カンプ 15415:21494・写真の並びは 15212:24785）
 *
 * キービジュアルの真下。写真が全画面・固定で敷かれ、右下にすりガラスの説明パネル、
 * 左下に3枚のサムネイル（いま出ていないもの）。
 *
 * v1.2 の見せ方（2026-08-21 ヒデさん指示）
 *   ・「1スクロールごと」に写真が次へ切り替わる（4枚 → 3回切り替わる）
 *   ・切替の見せ方は spotSwitchPatterns.ts の5案（右下パネルで切替）
 *   ・4枚目まで見終わったら、少しの余韻のあと次のセクション（グルメ）へ進める
 *   ・サムネイルを押すと、その写真の位置までスクロールが飛ぶ
 *
 * 登場の仕方（従来どおり）
 *   スクロールし始めると KV の背景がブラーで奥へ引く。それと入れ替わりに、
 *   1枚目の写真がブラーから合ってくる（spotTransition.ts の①〜③）。
 *
 * カンプから取った数値（1512x982 ステージ上の px）
 *   すりガラスのパネル … (759, 684) 712x238 / 地 white 10% / backdrop-blur 65px
 *   サムネイル … (40, 805) 3枚 各 164.845x110.442 / 間 14.4px / 角丸なし
 */
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  mergeSpotTransition,
  totalScroll,
  type SpotTransition,
} from "./spotTransition";
import { findSpotSwitch } from "./spotSwitchPatterns";

type Spot = {
  id: string;
  title: string;
  img: string;
  body: string;
};

/* 本文はカンプでは4画面とも同じ文言だったので、そのまま共通で持たせている */
const BODY =
  "いつもの騒がしい日常から抜けて、何も考えずぼーっと過ごせる場所。網走の広大に広がる地平線と豊かな自然に囲まれて、気の赴くままに自由に過ごせちゃう。";

/* 4枚ともカンプの実素材。並び順はカンプ 15212:24785 の左から
   （能取岬 → サンゴ草 → 網走駅 → 流氷。2026-08-21 ヒデさん指定） */
const SPOTS: Spot[] = [
  { id: "notoro", title: "能取岬", img: "/img/spot-notoro.jpg", body: BODY },
  { id: "sango", title: "能取湖サンゴ草群落地", img: "/img/spot-sangoso.jpg", body: BODY },
  { id: "eki", title: "網走駅", img: "/img/spot-eki.jpg", body: BODY },
  { id: "ryuhyo", title: "流氷クルーズ", img: "/img/spot-ryuhyo.jpg", body: BODY },
];

export default function SpotShowcase({
  scrollY,
  tune,
  switchPattern,
}: {
  scrollY: MotionValue<number>;
  /** 入れ替わりのタイミング（spotTransition.ts / 右下パネルで調整） */
  tune?: Partial<SpotTransition> | null;
  /** 1〜5: 写真切替の見せ方（spotSwitchPatterns.ts） */
  switchPattern?: number | string | null;
}) {
  const t = mergeSpotTransition(tune);
  const sw = findSpotSwitch(switchPattern);

  /* いま何枚目か。spotTo（1枚目が晴れきる位置）から stepLen ごとに次へ */
  const [index, setIndex] = useState(0);
  useMotionValueEvent(scrollY, "change", (v) => {
    /* spotTo（1枚目が晴れきる）までは 0 枚目。
       そこから stepLen 進むごとに 1 → 2 → 3 枚目 */
    const idx =
      v < t.spotTo
        ? 0
        : Math.min(SPOTS.length - 1, Math.floor((v - t.spotTo) / t.stepLen));
    if (idx !== index) setIndex(idx);
  });
  const spot = SPOTS[index];
  /* サムネイルは「今出ていないもの」を並び順のまま3枚 */
  const thumbs = SPOTS.filter((_, i) => i !== index);

  /* KV の背景がブラーで奥へ引くのと入れ違いになるよう、
     こちらは同じ帯でブラーが晴れながら濃くなる＝クロスで入れ替わって見える */
  const opacity = useTransform(scrollY, [0, t.spotFrom, t.spotTo], [0, 0, 1]);
  const filter = useTransform(
    scrollY,
    [0, t.spotFrom, t.spotTo],
    [`blur(${t.spotBlur}px)`, `blur(${t.spotBlur}px)`, "blur(0px)"]
  );
  /* ほぼ晴れるまでは触れないようにして、KV のボタンを邪魔しない */
  const pointerEvents = useTransform(scrollY, (v) =>
    v > t.spotFrom + (t.spotTo - t.spotFrom) * 0.75 ? "auto" : "none"
  );

  /* サムネイルを押したら、その写真の位置までスクロールを送る */
  const jumpTo = (i: number) => {
    const sc = document.querySelector<HTMLElement>("[data-abashiri-scroller]");
    if (!sc) return;
    const target = i === 0 ? t.spotTo : t.spotTo + t.stepLen * i + 1;
    const step = () => {
      const dy = target - sc.scrollTop;
      if (Math.abs(dy) < 0.5) {
        sc.scrollTop = target;
        return;
      }
      sc.scrollTop += dy * 0.14;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    /* 高さ ＝ 画面ぶん(982) ＋ 総スクロール量（晴れるまで＋切替3回＋余韻）。
       内側が sticky なので、その間このセクションが画面に居座る＝全画面・固定で見える */
    <div
      /* ⚠️ pointer-events-none は必須。
         この入れ物は KV の上に重なる（DOM 順で後ろ＝手前に描かれる）ので、
         付け忘れると透明なまま KV の「ぼーっとしてみる」ボタンのクリックを
         飲み込んでしまう（v1.1 で実際に起きた） */
      className="pointer-events-none relative"
      style={{ marginTop: -982, height: 982 + totalScroll(t, SPOTS.length) }}
    >
      <motion.section
        id="spot"
        className="sticky top-0 h-[982px] w-full overflow-hidden"
        style={{ opacity, filter, pointerEvents }}
      >
        {/* 全画面の写真。1スクロールごとに次の1枚へ（見せ方は5案から） */}
        <AnimatePresence initial={false}>
          <motion.div
            key={spot.id}
            className="absolute inset-0"
            initial={sw.imgInitial}
            animate={sw.imgAnimate}
            exit={sw.imgExit}
            transition={{ duration: sw.duration, ease: sw.ease as never }}
          >
            <img
              src={spot.img}
              alt={spot.title}
              className="size-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* すりガラスの説明パネル。カンプ 15152:29490。
            写真と一緒に、案ごとの質感で出直す */}
        <AnimatePresence mode="wait">
          <motion.div
            key={spot.id}
            className="absolute right-[41px] top-[684px] flex h-[238px] w-[712px] flex-col justify-center gap-6 bg-white/10 p-11 backdrop-blur-65"
            initial={sw.textInitial}
            animate={sw.textAnimate}
            exit={{ opacity: 0 }}
            transition={{
              duration: Math.min(0.8, sw.duration * 0.6),
              delay: sw.textDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex w-full items-end gap-6">
              <div className="flex min-w-px flex-1 flex-col gap-2 font-thin leading-[1.2] text-white">
                <p className="whitespace-nowrap text-body-18 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                  ぼーっとスポット
                </p>
                <p className="whitespace-nowrap text-[36px]">{spot.title}</p>
              </div>
              <button
                type="button"
                className="flex shrink-0 cursor-pointer items-center gap-1 transition-opacity hover:opacity-70"
              >
                <span className="whitespace-nowrap text-right text-[17px] font-extralight leading-[1.2] text-white">
                  もっと見る
                </span>
                <img src="/img/icon-more-circle.svg" alt="" className="size-[18px]" />
              </button>
            </div>
            <p className="w-full text-control-14 font-extralight leading-[2.2] tracking-[0.7px] text-white">
              {spot.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 左下のサムネイル。押すとその写真の位置までスクロールが飛ぶ */}
        <div className="absolute left-[40px] top-[805px] flex items-center gap-[14.4px]">
          {thumbs.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => jumpTo(SPOTS.indexOf(th))}
              aria-label={th.title}
              className="h-[110.442px] w-[164.845px] cursor-pointer overflow-hidden transition-transform duration-500 ease-standard hover:scale-[1.03]"
            >
              <img src={th.img} alt={th.title} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
