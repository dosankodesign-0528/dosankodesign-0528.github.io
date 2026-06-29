import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { COORDINATE_HERO, COORDINATE_THUMBS } from "@/data/site";

export default function Coordinate() {
  return (
    <Reveal as="section" className="py-20 md:py-28">
      <div className="mx-auto max-w-content px-8">
        <SectionHeading en="Coordinate" jp="コーディネート" />
      </div>

      <div className="mt-10 flex flex-col items-center gap-10 md:mt-20 md:gap-20">
        {/* メイン画像 */}
        <div className="mx-auto w-full max-w-content px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COORDINATE_HERO}
            alt="コーディネート事例"
            className="aspect-[326/237] w-full object-cover md:aspect-[1170/680]"
          />
        </div>

        {/* サムネイル列（横スクロール／画面端まで） */}
        <div className="w-full overflow-x-auto">
          <div className="flex w-max gap-3 px-8">
            {COORDINATE_THUMBS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-[127px] w-[218px] shrink-0 object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
