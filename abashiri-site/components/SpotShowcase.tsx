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
 * 写真は4枚ともカンプの実素材（2026-08-18 に差し替え済み）。
 */
import { useState } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import {
  mergeSpotTransition,
  totalScroll,
  type SpotTransition,
} from "./spotTransition";

type Spot = {
  id: string;
  title: string;
  img: string;
  body: string;
};

/* 本文はカンプでは4画面とも同じ文言だったので、そのまま共通で持たせている */
const BODY =
  "いつもの騒がしい日常から抜けて、何も考えずぼーっと過ごせる場所。網走の広大に広がる地平線と豊かな自然に囲まれて、気の赴くままに自由に過ごせちゃう。";

/* 4枚ともカンプ（15191:2178）の実素材。
   2026-08-18 に Figma MCP で元画像を書き出して差し替えた（それまでは手持ちの仮置き）。
   並び順もカンプの4画面と同じ（能取岬 → サンゴ草 → 網走駅 → 流氷）。 */
const SPOTS: Spot[] = [
  /* カンプ 15152:29475：牧草ロールの向こうに灯台 */
  { id: "notoro", title: "能取岬", img: "/img/spot-notoro.jpg", body: BODY },
  /* カンプ 15152:29500：木道に人が立つ赤いサンゴ草 */
  { id: "sango", title: "能取湖サンゴ草群落地", img: "/img/spot-sangoso.jpg", body: BODY },
  /* カンプ 15152:29524：「あばしり」の駅名標が立つホーム */
  { id: "eki", title: "網走駅", img: "/img/spot-eki.jpg", body: BODY },
  /* カンプ 15152:29547：一面の流氷 */
  { id: "ryuhyo", title: "流氷クルーズ", img: "/img/spot-ryuhyo.jpg", body: BODY },
];

export default function SpotShowcase({
  scrollY,
  tune,
}: {
  scrollY: MotionValue<number>;
  /** 入れ替わりのタイミング（spotTransition.ts / /mock/spot-tune で調整） */
  tune?: Partial<SpotTransition> | null;
}) {
  const [index, setIndex] = useState(0);
  const spot = SPOTS[index];
  /* サムネイルは「今出ていないもの」を並び順のまま3枚 */
  const thumbs = SPOTS.filter((_, i) => i !== index);

  const t = mergeSpotTransition(tune);

  /* KV の背景がブラーで奥へ引くのと入れ違いになるよう、
     こちらは同じ帯でブラーが晴れながら濃くなる＝クロスで入れ替わって見える。
     晴れきる位置 (spotTo) から先が「固定ビュー」 */
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

  return (
    /* 高さ ＝ 画面ぶん(982) ＋ 総スクロール量(spotTo + hold)。
       内側が sticky なので、その間このセクションが画面に居座る。
       ⚠️ hold を削るとブラーが晴れた直後に次のセクションへ押し出され、
          サムネイルを押す間がなくなる（v1.1 で一度やって戻した） */
    <div
      /* ⚠️ pointer-events-none は必須。
         この入れ物は KV の上に重なる（DOM 順で後ろ＝手前に描かれる）ので、
         付け忘れると透明なまま KV の「ぼーっとしてみる」ボタンのクリックを
         飲み込んでしまう（v1.1 で実際に起きた。中の section 側は
         style の pointerEvents で auto に戻している） */
      className="pointer-events-none relative"
      style={{ marginTop: -982, height: 982 + totalScroll(t) }}
    >
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
