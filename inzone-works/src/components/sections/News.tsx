import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { NEWS_FEATURED, NEWS_LIST, NEWS_TABS } from "@/data/site";

/** 日付＋カテゴリタグ */
function Meta({ date, category }: { date: string; category: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-en text-[18px] font-extralight leading-none text-warm">
        {date}
      </span>
      <span className="border-[0.5px] border-warm px-3 py-0.5 font-jp text-[10px] font-light leading-none text-warm">
        {category}
      </span>
    </div>
  );
}

export default function News() {
  return (
    <Reveal as="section" className="py-20 md:py-28">
      <div className="mx-auto max-w-content px-8">
        <SectionHeading en="News" jp="お知らせ" />

        <div className="mt-10 flex flex-col gap-12 md:mt-12 md:flex-row md:items-end md:justify-between">
          {/* 注目記事（左・大） */}
          <article className="shrink-0 md:w-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NEWS_FEATURED.image}
              alt=""
              className="aspect-[326/213] w-full object-cover md:aspect-[320/209]"
            />
            <div className="mt-4 flex flex-col gap-3">
              <Meta date={NEWS_FEATURED.date} category={NEWS_FEATURED.category} />
              <p className="font-jp text-[14px] font-light leading-[2] text-black">
                {NEWS_FEATURED.title}
              </p>
            </div>
          </article>

          {/* タブ＋リスト（右） */}
          <div className="md:w-[660px] md:pr-[60px]">
            {/* カテゴリタブ */}
            <div className="flex items-center gap-2">
              {NEWS_TABS.map((tab, i) => (
                <div key={tab} className="flex items-center gap-2">
                  {i > 0 && <span className="h-5 w-px bg-black/30" />}
                  <span
                    className={`font-jp text-[14px] font-light tracking-[0.7px] text-black ${
                      i === 0 ? "" : "opacity-30"
                    }`}
                  >
                    {tab}
                  </span>
                </div>
              ))}
            </div>

            {/* 記事リスト（PC は階段状に少しずつ右へ） */}
            <ul className="mt-8 flex flex-col gap-8 md:mt-12 md:gap-[60px]">
              {NEWS_LIST.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-4 md:gap-6 ${
                    ["md:pl-0", "md:pl-[60px]", "md:pl-[120px]"][i] ?? ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt=""
                    className="h-[65px] w-[100px] shrink-0 object-cover md:h-[85px] md:w-[130px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Meta date={item.date} category={item.category} />
                    <p className="truncate font-jp text-[14px] font-light leading-[2] text-black">
                      {item.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
