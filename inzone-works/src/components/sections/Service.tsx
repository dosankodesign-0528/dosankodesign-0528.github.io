"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { SERVICES, type Service as ServiceType } from "@/data/site";

function ServiceCard({ service }: { service: ServiceType }) {
  return (
    <a
      href="#"
      className="group flex shrink-0 flex-col gap-4 md:w-[837px] md:flex-row md:items-center md:gap-[106px]"
    >
      <div className="overflow-hidden md:shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.image}
          alt={service.titleJp}
          className="h-[160px] w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05] md:h-[540px] md:w-[310px]"
        />
      </div>
      <div className="flex flex-col gap-4 md:w-[421px] md:gap-[53px]">
        <div className="flex flex-col gap-6 md:gap-[45px]">
          <div className="flex flex-col gap-2 md:gap-[14px]">
            <h3 className="font-en text-[28px] font-thin leading-none text-black transition-opacity duration-300 group-hover:opacity-60 md:text-[50px]">
              {service.titleEn}
            </h3>
            <p className="font-jp text-[12px] font-thin leading-none text-black md:text-[16px] md:font-light">
              {service.titleJp}
            </p>
          </div>
          <span className="block h-px w-[80px] origin-left bg-warm transition-transform duration-500 ease-out group-hover:scale-x-[1.6] md:w-[222px]" />
        </div>
        <p className="font-jp text-[12px] font-light leading-[2] tracking-[0.6px] text-black md:text-[14px] md:tracking-[0.7px]">
          {service.description}
        </p>
      </div>
    </a>
  );
}

export default function Service() {
  const outerRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  // PC のみ：縦スクロール連動で横移動させるための高さ
  const [sectionHeight, setSectionHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    let maxX = 0;
    let rafId = 0;

    const measure = () => {
      const track = trackRef.current;
      const isDesktop = window.innerWidth >= 768;
      // レイアウト（縦積み/横並び・sticky）は CSS の md: が担当。
      // ここでは横並び時のトラック全幅から横移動量を測り、区間の高さだけ与える。
      if (!track || !isDesktop) {
        maxX = 0;
        setSectionHeight(undefined);
        if (track) track.style.transform = "";
        return;
      }
      maxX = Math.max(0, track.scrollWidth - window.innerWidth);
      setSectionHeight(maxX > 0 ? window.innerHeight + maxX : undefined);
    };

    const loop = () => {
      const outer = outerRef.current;
      const track = trackRef.current;
      if (outer && track && maxX > 0) {
        const top = outer.getBoundingClientRect().top;
        const progress = Math.min(1, Math.max(0, -top / maxX));
        track.style.transform = `translate3d(${-progress * maxX}px,0,0)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    // 画像読み込みでトラック幅が変わるため、少し遅延しても再計測
    measure();
    const t = window.setTimeout(measure, 600);
    rafId = requestAnimationFrame(loop);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={outerRef} className="relative" style={{ height: sectionHeight }}>
      {/* PC は画面に貼り付き、SP は通常フロー */}
      <div className="py-20 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-center md:overflow-hidden md:py-0">
        <div className="mx-auto w-full max-w-content px-8">
          <Reveal>
            <SectionHeading en="Service" jp="サービス" />
          </Reveal>
        </div>

        {/* SP は縦積み、PC は横並び（縦スクロールで横移動） */}
        <div
          ref={trackRef}
          className="mt-10 flex flex-col gap-11 px-8 md:mt-16 md:flex-row md:gap-[180px] md:px-0 md:pl-[130px] md:pr-[130px] md:will-change-transform"
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.titleEn} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
