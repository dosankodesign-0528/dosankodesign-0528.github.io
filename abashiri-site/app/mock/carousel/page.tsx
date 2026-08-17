import Link from "next/link";
import { CAROUSEL_PATTERNS } from "@/components/carouselPatterns";

export default function CarouselIndex() {
  return (
    /* globals.css で html/body に overflow:hidden が掛かっているので自前でスクロールさせる */
    <main className="h-dvh overflow-y-auto bg-[#e6f3ff] px-6 py-12">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="text-[13px] font-medium tracking-[0.12em] text-[#0070c9]">
          ABASHIRI v1.1 / BOTTO EXPERIENCE
        </p>
        <h1 className="mt-2 text-[28px] font-light leading-[1.4] text-[#0b3c69]">
          場所えらびカルーセル　3案
        </h1>
        <p className="mt-3 text-[15px] font-light leading-[1.8] text-[#3c4a57]">
          <strong className="font-medium">選べるのは中央に来たカードだけ</strong>です。
          左右のカードにはボタンを出さず、少し引いて（55%）見せています。
          <br />
          中央に来たカードだけが拡大して、動画プレビューと「この場所にする」が出ます。
        </p>

        <div className="mt-6 rounded-2xl bg-[#fff7e8] px-6 py-4">
          <p className="text-[14px] font-medium text-[#8a6314]">中央固定にした理由</p>
          <p className="mt-1 text-[13px] font-light leading-[1.8] text-[#6b5010]">
            窓に入る遷移が「中央から真っ直ぐ膨らむ」だけになるためです。
            横に滑りながら膨らむと、近づいている動きではなく
            「部品が中央に飛んできた」動きに見えてしまいます。
          </p>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {CAROUSEL_PATTERNS.map((p, i) => (
            <li key={p.key}>
              <Link
                href={`/mock/carousel/${i + 1}`}
                className="block rounded-2xl bg-white px-6 py-5 shadow-sm transition-transform hover:scale-[1.01]"
              >
                <p className="text-[18px] font-medium text-[#0b3c69]">{p.label}</p>
                <p className="mt-1 text-[14px] font-light leading-[1.7] text-[#5a6b7a]">
                  {p.note}
                </p>
                <p className="mt-2 text-[12px] font-light text-[#8c9ba8]">
                  {p.continuous
                    ? `流れ続ける（1枚 ${(p.slide / 1000).toFixed(1)}秒）`
                    : `中央で ${(p.dwell / 1000).toFixed(0)}秒 止まる ／ 切り替え ${(p.slide / 1000).toFixed(1)}秒`}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[13px] font-light leading-[1.8] text-[#5a6b7a]">
          採用案が決まったら、他の2案は消します（dev サーバが重くなるため）。
        </p>
      </div>
    </main>
  );
}
