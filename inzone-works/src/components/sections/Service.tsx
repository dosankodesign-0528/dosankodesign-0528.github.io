import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { SERVICES, type Service as ServiceType } from "@/data/site";

function ServiceCard({ service }: { service: ServiceType }) {
  return (
    <article className="flex shrink-0 flex-col gap-4 md:w-[837px] md:flex-row md:items-center md:gap-[106px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={service.image}
        alt={service.titleJp}
        className="h-[160px] w-full object-cover md:h-[540px] md:w-[310px]"
      />
      <div className="flex flex-col gap-4 md:w-[421px] md:gap-[53px]">
        <div className="flex flex-col gap-6 md:gap-[45px]">
          <div className="flex flex-col gap-2 md:gap-[14px]">
            <h3 className="font-en text-[28px] font-thin leading-none text-black md:text-[50px]">
              {service.titleEn}
            </h3>
            <p className="font-jp text-[12px] font-thin leading-none text-black md:text-[16px] md:font-light">
              {service.titleJp}
            </p>
          </div>
          <span className="block h-px w-[80px] bg-warm md:w-[222px]" />
        </div>
        <p className="font-jp text-[12px] font-light leading-[2] tracking-[0.6px] text-black md:text-[14px] md:tracking-[0.7px]">
          {service.description}
        </p>
      </div>
    </article>
  );
}

export default function Service() {
  return (
    <Reveal as="section" className="py-20 md:py-28">
      <div className="mx-auto max-w-content px-8">
        <SectionHeading en="Service" jp="サービス" />
      </div>

      {/* SP は縦積み、PC は横スクロールのスライダー */}
      <div className="mt-10 flex flex-col gap-11 px-8 md:mt-24 md:flex-row md:gap-[260px] md:overflow-x-auto md:px-0 md:pl-[130px] md:pr-[130px]">
        {SERVICES.map((service) => (
          <ServiceCard key={service.titleEn} service={service} />
        ))}
      </div>
    </Reveal>
  );
}
