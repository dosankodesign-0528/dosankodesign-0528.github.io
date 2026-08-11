import Link from "next/link";
import { INTRO_PATTERNS } from "@/components/introPatterns";

/* 出現アニメーション比較 mock 一覧 */
export default function IntroMockIndex() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          出現アニメーション 比較mock（5案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          ヘッダー → キービジュアルの順にブラーで登場します。
          <br />
          各案とも本物のTOPページそのままなので、リロードすると何度でも見られます。
        </p>
        <div className="flex flex-col gap-4">
          {Object.entries(INTRO_PATTERNS).map(([n, p]) => (
            <Link
              key={n}
              href={`/mock/intro/${n}`}
              className="rounded-2xl bg-white/90 p-5 backdrop-blur transition-transform hover:scale-[1.02]"
            >
              <p className="mb-1 text-[18px] font-black text-[#0070c9]">
                案{n}：{p.name}
              </p>
              <p className="text-[13px] font-medium text-[#1e1e1e]">
                ヘッダー {p.headerDur}秒 / キービジュアル {p.heroDur}秒（{p.heroDelay}
                秒遅れ）・ブラー {p.heroBlur}px
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
