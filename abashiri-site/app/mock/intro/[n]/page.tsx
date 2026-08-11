import Link from "next/link";
import Stage from "@/components/Stage";
import TopMock from "@/components/TopMock";
import { INTRO_PATTERNS } from "@/components/introPatterns";

/* 出現アニメーション比較：本物のTOPページに各パターンを適用 */
export function generateStaticParams() {
  return Object.keys(INTRO_PATTERNS).map((n) => ({ n }));
}

export default async function IntroMockPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const num = Number(n);
  const p = INTRO_PATTERNS[num] ?? INTRO_PATTERNS[1];
  return (
    <>
      <Stage illustration="tamannee">
        <TopMock intro={num} />
      </Stage>
      <div className="fixed left-3 top-3 z-50 flex items-center gap-2">
        <Link
          href="/mock/intro"
          className="rounded-full bg-white/95 px-4 py-2 text-[13px] font-black text-[#0070c9] shadow"
        >
          ← 一覧へ
        </Link>
        <p className="rounded-full bg-[#0070c9]/85 px-4 py-2 text-[13px] font-bold text-white shadow">
          案{num}：{p.name}
        </p>
      </div>
    </>
  );
}
