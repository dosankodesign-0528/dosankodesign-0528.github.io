"use client";

import { useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { COORDINATE_HERO, COORDINATE_THUMBS } from "@/data/site";

export default function Coordinate() {
  // 下のサムネをクリックすると上のメイン画像に反映される
  const [active, setActive] = useState<number | null>(null);
  const mainSrc = active === null ? COORDINATE_HERO : COORDINATE_THUMBS[active];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-content px-8">
        <Reveal>
          <SectionHeading en="Coordinate" jp="コーディネート" />
        </Reveal>
      </div>

      <div className="mt-10 flex flex-col items-center gap-10 md:mt-20 md:gap-20">
        {/* メイン画像（クリックで切り替わる） */}
        <Reveal delay={0.08} className="mx-auto w-full max-w-content px-8">
          <div className="aspect-[326/237] w-full overflow-hidden md:aspect-[1170/680]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={mainSrc}
              src={mainSrc}
              alt="コーディネート事例"
              className="coord-fade h-full w-full object-cover"
            />
          </div>
        </Reveal>

        {/* サムネイル列（横スクロール／クリックで選択） */}
        <div className="w-full overflow-x-auto">
          <div className="flex w-max gap-3 px-8">
            {COORDINATE_THUMBS.map((src, i) => {
              const isActive = active === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`コーディネート ${i + 1} を表示`}
                  aria-pressed={isActive}
                  className={`group block h-[127px] w-[218px] shrink-0 overflow-hidden outline-none transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-55 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                      isActive ? "scale-105" : ""
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
