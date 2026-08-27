"use client";

/* eslint-disable @next/next/no-img-element */
/*
 * スマホ（〜640px）用のトップ。デスクトップの固定キャンバス（Stage＋TopPage）とは別に、
 * 390px で美しく見えるモバイル専用レイアウトをここに作る（2026-08-24 ヒデさん依頼）。
 *
 * 基本ルール（ヒデさん指定）
 *   ・コンテンツは左右 24px パディング（px-6）
 *   ・文字サイズは最小 12px
 *   ・デスクトップの世界観（書体・色・余白・すりガラス）を踏襲
 *
 * まずは KV（ファーストビュー）から。素材は既存を再利用：
 *   背景 bg-hero.jpg / 作字 hero-message.svg / ラベル text-kanko-site.svg
 *   環境音トグルは共通の SoundUi が #abashiri-sound-slot へ描画する
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
    /* 同一ページ内セクションへスクロール（未実装セクションは何もしない） */
    const el =
      item.to === "top"
        ? document.querySelector("[data-mobile-scroller]")
        : document.getElementById(item.to || "");
    if (item.to === "top") {
      document
        .querySelector("[data-mobile-scroller]")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    /* サイト全体は overflow:hidden なので、モバイルは main を自前スクロールにする
       （SCROLL-RULES.md）。今は KV 1画面だが、後続セクション追加に備える */
    <main
      data-mobile-scroller
      className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-sky-bottom"
    >
      {/* ── KV ───────────────────────────── */}
      <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden">
        {/* 背景写真 */}
        <img
          src="/img/bg-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 可読性のためのごく薄い上グラデ（白ロゴ・トグルを締める） */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/15 to-transparent" />

        {/* ヘッダー（左右 24px） */}
        <header className="relative z-20 flex items-center justify-between px-6 pt-5">
          {/* 環境音 ON/OFF：共通の SoundUi がここへ描画する */}
          <div
            id="abashiri-sound-slot"
            className="flex h-[24px] items-center"
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
