"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV } from "@/data/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-5 md:py-10">
        {/* ロゴ */}
        <Link href="/" aria-label="inZONE with ACTUS" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.svg"
            alt="inZONE with ACTUS"
            className="h-9 w-auto md:h-[58px]"
          />
        </Link>

        {/* PC ナビ */}
        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-jp text-[14px] font-light text-black transition-opacity hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/business"
            className="border-[0.5px] border-warm px-6 py-1 font-jp text-[12px] font-light text-warm transition-colors hover:bg-warm hover:text-white"
          >
            法人のお客様
          </Link>
        </nav>

        {/* SP 右側：法人ボタン＋ハンバーガー */}
        <div className="flex items-center gap-6 md:hidden">
          <Link
            href="/business"
            className="whitespace-nowrap border-[0.5px] border-warm px-3 py-1 font-jp text-[12px] font-light text-black"
          >
            法人のお客様
          </Link>
          <button
            type="button"
            aria-label="メニューを開く"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-[13px] w-8 flex-col justify-between"
          >
            <span className="block h-px w-full bg-black" />
            <span className="block h-px w-full bg-black" />
            <span className="block h-px w-full bg-black" />
          </button>
        </div>
      </div>

      {/* SP メニューオーバーレイ */}
      <div
        className={`fixed inset-0 z-50 bg-white transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.svg" alt="inZONE with ACTUS" className="h-9 w-auto" />
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="relative h-6 w-6"
          >
            <span className="absolute left-0 top-1/2 block h-px w-full rotate-45 bg-black" />
            <span className="absolute left-0 top-1/2 block h-px w-full -rotate-45 bg-black" />
          </button>
        </div>
        <nav className="flex flex-col px-8 pt-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/40 py-5 font-jp text-[15px] font-light text-black"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/business"
            onClick={() => setOpen(false)}
            className="mt-8 border-[0.5px] border-warm py-3 text-center font-jp text-[13px] font-light text-warm"
          >
            法人のお客様
          </Link>
        </nav>
      </div>
    </header>
  );
}
