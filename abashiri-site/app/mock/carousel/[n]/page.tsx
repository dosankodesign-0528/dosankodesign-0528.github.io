"use client";

import { use, useState } from "react";
import Link from "next/link";
import Stage from "@/components/Stage";
import ExperienceFlow, { type Step } from "@/components/ExperienceFlow";
import { CAROUSEL_PATTERNS } from "@/components/carouselPatterns";

/* 場所えらびカルーセルの動き方 3案。
   選べるのは中央に来たカードだけ。左右にはボタンを出さない。 */
export default function CarouselMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = use(params);
  const idx = Math.min(Math.max(Number(n) || 1, 1), CAROUSEL_PATTERNS.length);
  const pat = CAROUSEL_PATTERNS[idx - 1];
  const [step, setStep] = useState<Step>(2);

  return (
    <>
      <Stage illustration="bo">
        <ExperienceFlow step={step} setStep={setStep} carousel={idx} />
      </Stage>

      <div className="fixed left-3 top-3 z-[70] flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-2">
        <Link
          href="/mock/carousel"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-medium text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-medium text-white shadow">
          {pat.label}　{pat.note}
        </p>
        {step === 3 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="cursor-pointer rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0b3c69] shadow transition-transform hover:scale-105"
          >
            ↺ カルーセルに戻る
          </button>
        )}
      </div>
    </>
  );
}
