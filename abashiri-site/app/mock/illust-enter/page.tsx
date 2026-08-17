import Link from "next/link";
import { ILLUST_ENTER_PATTERNS } from "@/components/illustEnterPatterns";

export default function IllustEnterIndex() {
  return (
    /* globals.css で html/body に overflow:hidden が掛かっているので自前でスクロールさせる */
    <main className="h-dvh overflow-y-auto bg-[#e6f3ff] px-6 py-12">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="text-[13px] font-medium tracking-[0.12em] text-[#0070c9]">
          ABASHIRI v1.1 / KEY VISUAL
        </p>
        <h1 className="mt-2 text-[28px] font-light leading-[1.4] text-[#0b3c69]">
          人物イラストの登場演出　5案
        </h1>
        <p className="mt-3 text-[15px] font-light leading-[1.8] text-[#3c4a57]">
          キービジュアルの演出が全部終わったあと（開いてから約4.5秒後）に人物が出てきます。
          <br />
          着地点はどの案も同じカンプ位置で、<strong className="font-medium">そこへ来るまでの動き方だけ</strong>を変えています。
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {ILLUST_ENTER_PATTERNS.map((p, i) => (
            <li key={p.key}>
              <Link
                href={`/mock/illust-enter/${i + 1}`}
                className="block rounded-2xl bg-white px-6 py-5 shadow-sm transition-transform hover:scale-[1.01]"
              >
                <p className="text-[18px] font-medium text-[#0b3c69]">{p.label}</p>
                <p className="mt-1 text-[14px] font-light leading-[1.7] text-[#5a6b7a]">
                  {p.note}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[13px] font-light leading-[1.8] text-[#5a6b7a]">
          採用案が決まったら、他の4案は消します（dev サーバが重くなるため）。
        </p>
      </div>
    </main>
  );
}
