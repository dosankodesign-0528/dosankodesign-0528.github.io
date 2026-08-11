import Link from "next/link";
import { WRITE_PACES } from "@/components/writePaces";

/* なぞり書きスピード比較 mock 一覧（手書きアニメは案1採用済み） */
export default function WriteMockIndex() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#35c3ea] to-[#b5d7ff] px-6 py-14">
      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-2 text-[28px] font-black text-white">
          なぞり書きスピード 比較mock（3案）
        </h1>
        <p className="mb-8 text-[14px] font-bold leading-relaxed text-white/90">
          採用済みの「なぞり書き」の速さ違いです。
          <br />
          どれも本物のTOPページ。リロードすると何度でも見られます。
        </p>
        <div className="flex flex-col gap-4">
          {Object.entries(WRITE_PACES).map(([n, p]) => (
            <Link
              key={n}
              href={`/mock/write/${n}`}
              className="rounded-2xl bg-white/90 p-5 backdrop-blur transition-transform hover:scale-[1.02]"
            >
              <p className="mb-1 text-[18px] font-black text-[#0070c9]">
                案{n}：{p.name}
              </p>
              <p className="text-[13px] font-medium leading-relaxed text-[#1e1e1e]">
                一画 {p.min}〜{p.max}ms・画のあいだの間 {p.gap}ms
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
