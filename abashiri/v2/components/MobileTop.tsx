"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * スマホ（〜640px）用のトップ。デスクトップの固定キャンバス（Stage＋TopPage）とは別に、
 * 390px で美しく見えるモバイル専用レイアウト（2026-08-24 ヒデさん依頼）。
 *
 * 基本ルール（ヒデさん指定）
 *   ・コンテンツは左右 24px パディング（px-6）
 *   ・文字サイズは最小 12px
 *   ・デスクトップの世界観（書体・色・余白・すりガラス）を踏襲
 *
 * セクション：KV → メッセージ → ぼーっとスポット → グルメ（体験は /experience）。
 * コピー・写真はデスクトップ実装（MessageSection / SpotShowcase / GourmetSection）と同じ実データ。
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { preload } from "react-dom";

const NAV: { label: string; href?: string; to?: string }[] = [
  { label: "ホーム", to: "top" },
  { label: "ぼーっとスポット", to: "m-spot" },
  { label: "グルメ", to: "m-gourmet" },
  { label: "体験", href: "/experience" },
];

/* メッセージ（カンプ 15480:22896・MessageSection と同文） */
const MSG_TITLE = "網走は何もない。";
const MSG_BLOCKS: string[][] = [
  ["よくそんなことを言われます。", "ただ、それがいいんです。魅力なんです。"],
  [
    "いまの情報過多な日本で暮らしていると、考えることが多すぎです。",
    "休んでいるあいだも、頭が動き続けている。",
  ],
  ["網走は何も考えなくていい時間、ぼーっとする時間をお届けします。"],
  ["オホーツクの海と、広大な大地と、空。", "それ以外は、何もありません。"],
  ["網走は何もない。だから、たまらない。"],
];

/* ぼーっとスポット（SpotShowcase と同データ） */
const SPOTS = [
  {
    no: "01",
    title: "能取岬",
    img: "/img/spot-notoro.jpg",
    body: "オホーツク海に突き出た岬で、突端には灯台と管理事務所があるだけ。ここから西方は能取湖と常呂町の海岸、北方はすべてオホーツク海、東方は遠く知床連山が眺められます。",
  },
  {
    no: "02",
    title: "能取湖サンゴ草群落地",
    img: "/img/spot-sangoso.jpg",
    body: "能取湖の南岸、卯原内に位置する「能取湖サンゴ草群生地」は、別名アッケシソウと呼ばれるサンゴ草の日本一を誇る群落地です。",
  },
  {
    no: "03",
    title: "網走駅",
    img: "/img/spot-eki.jpg",
    body: "石北本線と釧網本線が乗り入れる、オホーツクの玄関口。縦書きの駅名標には「人生を横道にそれず、まっすぐ歩んでほしい」という願いが込められていると伝わります。",
  },
  {
    no: "04",
    title: "流氷クルーズ",
    img: "/img/spot-ryuhyo.jpg",
    body: "冬のオホーツク海を埋め尽くす流氷は、はるかアムール川から流れ着く自然の贈りもの。砕氷船に乗れば、白い海原を割って進む音と揺れを全身で感じられます。",
  },
];

/* 素朴なグルメ（GourmetSection と同データ） */
const GOURMET = [
  { no: "01", title: "横山蒲鉾店", img: "/img/gourmet-new-1.jpg" },
  { no: "02", title: "松尾ジンギスカン 呼人支店", img: "/img/gourmet-new-2.jpg" },
  { no: "03", title: "ラーメンだるまや", img: "/img/gourmet-new-3.jpg" },
  { no: "04", title: "酒縁酒場 屯々", img: "/img/gourmet-new-4.jpg" },
];

export default function MobileTop() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  preload("/img/bg-hero.jpg", { as: "image", fetchPriority: "high" });

  const go = (item: (typeof NAV)[number]) => {
    setMenuOpen(false);
    if (item.href) {
      router.push(item.href);
      return;
    }
    const sc = document.querySelector("[data-mobile-scroller]");
    if (item.to === "top") {
      sc?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(item.to || "")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    /* サイト全体は overflow:hidden なので、モバイルは main を自前スクロールにする
       （SCROLL-RULES.md） */
    <main
      data-mobile-scroller
      className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-sky-bottom"
    >
      {/* ── KV ───────────────────────────── */}
      <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden">
        <img
          src="/img/bg-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/15 to-transparent" />

        {/* ヘッダー（左右 24px） */}
        <header className="relative z-20 flex items-center justify-between px-6 pt-5">
          {/* 環境音 ON/OFF：共通の SoundUi がここへ描画。少し小さく（2026-08-24 ヒデさん指示） */}
          <div
            id="abashiri-sound-slot"
            className="flex h-[22px] origin-left scale-[0.72] items-center"
          />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="メニューを開く"
            className="flex size-9 items-center justify-center"
          >
            <span className="relative block h-[11px] w-[24px]">
              <span className="absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-white" />
              <span className="absolute bottom-0 left-0 h-[1.5px] w-full rounded-full bg-white" />
            </span>
          </button>
        </header>

        {/* 作字ロゴ（中央） */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28">
          <img
            src="/img/text-kanko-site.svg"
            alt="網走市観光サイト"
            className="mb-3 w-[104px]"
          />
          <img
            src="/img/hero-message.svg"
            alt="な〜んにもない、たまらない。"
            className="w-full max-w-[300px]"
          />
        </div>

        {/* CTA（左右 24px） */}
        <div className="absolute inset-x-0 bottom-9 z-10 flex justify-center px-6">
          <a
            href="/experience"
            onClick={(e) => {
              e.preventDefault();
              router.push("/experience");
            }}
            className="flex w-full max-w-[342px] items-center justify-center rounded-full bg-white/10 py-[15px] text-[15px] font-medium leading-none text-white ring-1 ring-inset ring-white/45 backdrop-blur-[12px] transition-transform active:scale-95"
          >
            ぼーっとしてみる
          </a>
        </div>
      </section>

      {/* ── メッセージ ─────────────────────── */}
      <section className="bg-gradient-to-b from-sky-top to-brand px-6 py-24 text-white">
        <h2 className="text-[28px] font-thin leading-[1.5]">{MSG_TITLE}</h2>
        <div className="mt-9 space-y-6 text-[14px] font-light leading-[2] tracking-[0.3px]">
          {MSG_BLOCKS.map((lines, i) => (
            <p key={i}>
              {lines.map((l, j) => (
                <span key={j} className="block">
                  {l}
                </span>
              ))}
            </p>
          ))}
        </div>
      </section>

      {/* ── ぼーっとスポット ─────────────────── */}
      <section id="m-spot" className="bg-sky-bottom">
        {SPOTS.map((spot) => (
          <div key={spot.no} className="relative h-[76dvh] w-full overflow-hidden">
            <img
              src={spot.img}
              alt={spot.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* 下から黒フェード＋テキスト（左右24px） */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-6 pb-9 pt-28 text-white">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-extralight">
                    ぼーっとスポット {spot.no}
                  </p>
                  <p className="mt-1 text-[22px] font-thin leading-tight">
                    {spot.title}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 pb-1 text-[12px] font-extralight">
                  もっと見る
                  <img src="/img/icon-view-more.svg" alt="" className="size-[16px]" />
                </span>
              </div>
              <p className="mt-3 text-[13px] font-extralight leading-[1.9] tracking-[0.3px]">
                {spot.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── 素朴なグルメ ───────────────────── */}
      <section id="m-gourmet" className="bg-white px-6 py-20">
        <h2 className="text-[20px] font-thin leading-[1.7] text-ink">
          なーんにもない、道東の土地、網走。
          <br />
          そこの味が沁みちゃうんです。
        </h2>
        <div className="no-scrollbar -mx-6 mt-8 flex gap-3 overflow-x-auto px-6">
          {GOURMET.map((card) => (
            <div
              key={card.no}
              className="relative w-[230px] shrink-0 overflow-hidden rounded-3xl"
            >
              <img
                src={card.img}
                alt={card.title}
                className="h-[300px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
                <p className="text-[12px] font-extralight">
                  素朴なグルメ {card.no}
                </p>
                <p className="mt-0.5 text-[16px] font-light leading-snug">
                  {card.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── フッター（体験への誘導） ───────────── */}
      <section className="bg-brand px-6 py-16 text-center text-white">
        <p className="text-[14px] font-light leading-[1.9]">
          網走で、なんにもしない時間を。
        </p>
        <a
          href="/experience"
          onClick={(e) => {
            e.preventDefault();
            router.push("/experience");
          }}
          className="mt-6 inline-flex w-full max-w-[342px] items-center justify-center rounded-full bg-white/15 py-[15px] text-[15px] font-medium leading-none text-white ring-1 ring-inset ring-white/45 backdrop-blur-[12px] transition-transform active:scale-95"
        >
          ぼーっと体験してみる
        </a>
      </section>

      {/* ── ハンバーガーメニュー ─────────────── */}
      {menuOpen && (
        <nav className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-9 bg-brand/95 text-white backdrop-blur-lg">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="閉じる"
            className="absolute right-6 top-6 flex size-9 items-center justify-center text-white"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 2L14 14M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => go(item)}
              className="text-[18px] font-light leading-none text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
