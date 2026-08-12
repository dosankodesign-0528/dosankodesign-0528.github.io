import Link from "next/link";
import { KAMI_PATTERNS } from "@/components/kamiPatterns";

/* 紙芝居パターン比較 mock 一覧 */
export default function KamiMockIndex() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          紙芝居パターン 比較mock（3案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          吹き出し → な → 伸ばし棒ビヨーン → 収まって んにもない → たまらない、の別パターン。
          <br />
          どれも本物のTOPページ。リロードすると何度でも見られます。
        </p>
        <div className="flex flex-col gap-4">
          {Object.entries(KAMI_PATTERNS).map(([n, p]) => (
            <Link
              key={n}
              href={`/mock/kami/${n}`}
              className="rounded-2xl bg-white/90 p-5 backdrop-blur transition-transform hover:scale-[1.02]"
            >
              <p className="mb-1 text-[18px] font-black text-[#0070c9]">
                案{n}：{p.name}
              </p>
              <p className="text-[13px] font-medium leading-relaxed text-[#1e1e1e]">
                {p.desc}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-[12px] font-bold text-white/80">
          ※ 今のなぞり書き演出は本番にそのまま残っています
        </p>
      </div>
    </main>
  );
}
