"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * ぼーっとスポット（v1.1 / カンプ 15191:2178 の4画面）
 *
 * キービジュアルの真下。写真が全画面で敷かれ、右下にすりガラスの説明パネル、
 * 左下に3枚のサムネイル。サムネイルを押すと、写真がディゾルブで入れ替わる。
 *
 * 登場の仕方
 *   スクロールし始めると KV の背景がブラーで奥へ引く。それと入れ替わりに、
 *   ここの写真がブラーから合ってくる（クロスディゾルブ）。
 *
 * カンプから取った数値（1512x982 ステージ上の px）
 *   すりガラスのパネル … (759, 684) 712x237 / 地 white 10% / backdrop-blur 65px
 *                        余白 44px / 縦の間隔 24px / 角丸なし
 *     ・小見出し「ぼーっとスポット」 Noto Sans JP Thin 18px 行間1.2
 *     ・見出し（地名）             Noto Sans JP Thin 36px 行間1.2
 *     ・もっと見る                 Noto Sans JP ExtraLight 17px ＋ 18px アイコン（間4px）
 *     ・本文                       Noto Sans JP ExtraLight 14px 行間2.2 字間0.7px 幅624px
 *   サムネイル … (40, 805) 3枚 各 164.845x110.442 / 間 14.4px / 角丸なし
 *
 * ⚠️ カンプの写真そのものはこの環境から取得できなかった（figma.com へのアクセスが
 *    ネットワークポリシーで塞がれている）。手持ちで一番近いものを仮置きしてある。
 *    placeholder: true が付いているものが差し替え待ち。
 */
import { useState } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";

type Spot = {
  id: string;
  title: string;
  img: string;
  body: string;
  /** カンプの写真が手に入らず、手持ちで仮置きしているもの */
  placeholder?: boolean;
};

/* 本文はカンプでは4画面とも同じ文言だったので、そのまま共通で持たせている */
const BODY =
  "いつもの騒がしい日常から抜けて、何も考えずぼーっと過ごせる場所。網走の広大に広がる地平線と豊かな自然に囲まれて、気の赴くままに自由に過ごせちゃう。";

const SPOTS: Spot[] = [
  /* カンプは牧草地に灯台が立つカット。手持ちで灯台が写っているのはこれだけ */
  { id: "notoro", title: "能取岬", img: "/img/bg-hero.jpg", body: BODY, placeholder: true },
  /* ここはカンプとほぼ同じ絵が手元にある */
  { id: "sango", title: "能取湖サンゴ草群落地", img: "/img/spot-3.jpg", body: BODY },
  /* 駅のホームの写真が無い。カルーセル3枚目と同じ差し替え待ち */
  { id: "eki", title: "網走駅", img: "/img/spot-1.jpg", body: BODY, placeholder: true },
  { id: "ryuhyo", title: "流氷クルーズ", img: "/img/ice.jpg", body: BODY },
];

export default function SpotShowcase({ scrollY }: { scrollY: MotionValue<number> }) {
  const [index, setIndex] = useState(0);
  const spot = SPOTS[index];
  /* サムネイルは「今出ていないもの」を並び順のまま3枚 */
  const thumbs = SPOTS.filter((_, i) => i !== index);

  /* KV の背景は [0,160,400] で 16px までぼける。それと入れ違いになるよう、
     こちらは同じ帯でブラーが晴れながら濃くなる＝クロスで入れ替わって見える */
  const opacity = useTransform(scrollY, [0, 120, 460], [0, 0, 1]);
  const filter = useTransform(scrollY, [0, 120, 460], [
    "blur(30px)",
    "blur(30px)",
    "blur(0px)",
  ]);
  /* 完全に出るまでは触れないようにして、KV のボタンを邪魔しない */
  const pointerEvents = useTransform(scrollY, (v) => (v > 380 ? "auto" : "none"));

  return (
    /* 高さ 1964px ＝ 画面ぶん(982) ＋ 見てもらうための余白(982)。
       内側が sticky なので、その間このセクションが画面に留まる */
    <div className="relative -mt-[982px] h-[1964px]">
      <motion.section
        id="spot"
        className="sticky top-0 h-[982px] w-full overflow-hidden"
        style={{ opacity, filter, pointerEvents }}
      >
        {/* 全画面の写真。サムネイルを押すとディゾルブで入れ替わる */}
        <AnimatePresence initial={false}>
          <motion.img
            key={spot.id}
            src={spot.img}
            alt={spot.title}
            className="absolute inset-0 size-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "linear" }}
          />
        </AnimatePresence>

        {/* すりガラスの説明パネル。カンプ 15152:29490 */}
        <div className="absolute right-[41px] top-[684px] flex h-[237px] w-[712px] flex-col justify-center gap-6 bg-white/10 p-11 backdrop-blur-65">
          <div className="flex w-full items-end gap-6">
            <div className="flex min-w-px flex-1 flex-col gap-6 font-thin leading-[1.2] text-white">
              <p className="whitespace-nowrap text-body-18">ぼーっとスポット</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={spot.id}
                  className="whitespace-nowrap text-[36px]"
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {spot.title}
                </motion.p>
              </AnimatePresence>
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
        </div>

        {/* 左下のサムネイル。押すと上の写真がディゾルブで入れ替わる */}
        <div className="absolute left-[40px] top-[805px] flex items-center gap-[14.4px]">
          {thumbs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setIndex(SPOTS.indexOf(t))}
              aria-label={t.title}
              className="h-[110.442px] w-[164.845px] cursor-pointer overflow-hidden transition-transform duration-500 ease-standard hover:scale-[1.03]"
            >
              <img src={t.img} alt={t.title} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
